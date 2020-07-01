// Copyright (c) 2017-2020, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import * as _ from 'lodash';
import * as resources from 'resources';
import * from 'jest';
import { BlackBoxTestUtil } from '../lib/BlackBoxTestUtil';
import { Commands} from '../../../src/api/commands/CommandEnumType';
import { Logger as LoggerType } from '../../../src/core/Logger';
import { MarketType } from '../../../src/api/enums/MarketType';
import { InvalidParamException } from '../../../src/api/exceptions/InvalidParamException';
import { MissingParamException } from '../../../src/api/exceptions/MissingParamException';
import { MessageException } from '../../../src/api/exceptions/MessageException';
import { PublicKey, PrivateKey, Networks } from 'particl-bitcore-lib';

describe('MarketAddCommand', () => {

    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);

    const randomBoolean: boolean = Math.random() >= 0.5;
    const testUtil = new BlackBoxTestUtil(randomBoolean ? 0 : 1);

    const marketCommand = Commands.MARKET_ROOT.commandName;
    const marketAddCommand = Commands.MARKET_ADD.commandName;

    let profile: resources.Profile;
    let market: resources.Market;

    const marketData = {
        name: 'TEST-1',
        type: MarketType.MARKETPLACE,
        receiveKey: 'receiveKey',
        publishKey: 'publishKey'
        // publishKey === receiveKey
    };

    const storeFrontAdminData = {
        name: 'TEST-2',
        type: MarketType.STOREFRONT_ADMIN,
        receiveKey: 'receiveKey',
        publishKey: 'publishKey'
        // receiveKey !== publishKey
    };

    const storeFrontUserData = {
        name: 'TEST-3',
        type: MarketType.STOREFRONT,
        receiveKey: 'receiveKey',           // private key in wif format
        publishKey: 'publishKey'            // publish key is public key (DER hex encoded string)
    };

    beforeAll(async () => {
        await testUtil.cleanDb();

        profile = await testUtil.getDefaultProfile();
        expect(profile.id).toBeDefined();
        market = await testUtil.getDefaultMarket(profile.id);
        expect(market.id).toBeDefined();

        // marketplace
        const network = Networks.testnet;
        let privateKey: PrivateKey = PrivateKey.fromRandom(Networks.testnet);
        marketData.receiveKey = privateKey.toWIF();
        marketData.publishKey = marketData.receiveKey;          // same same
        marketData.name = marketData.receiveKey;
        log.debug('marketData: ', JSON.stringify(marketData, null, 2));

        // storefront admin
        privateKey = PrivateKey.fromRandom(network);
        storeFrontAdminData.receiveKey = privateKey.toWIF();
        privateKey = PrivateKey.fromRandom(network);
        storeFrontAdminData.publishKey = privateKey.toWIF();    // but different
        storeFrontAdminData.name = storeFrontAdminData.receiveKey;
        log.debug('storeFrontAdminData: ', JSON.stringify(storeFrontAdminData, null, 2));

        // storefront user
        privateKey = PrivateKey.fromRandom(network);
        storeFrontUserData.receiveKey = privateKey.toWIF();
        privateKey = PrivateKey.fromRandom(network);
        storeFrontUserData.publishKey = privateKey.toPublicKey().toString();    // -> DER hex encoded string
        storeFrontUserData.name = storeFrontUserData.receiveKey;

        log.debug('storeFrontUserData: ', JSON.stringify(storeFrontUserData, null, 2));

    });

    test('Should fail to create Market because missing profileId', async () => {
        const res = await testUtil.rpc(marketCommand, [marketAddCommand]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('profileId').getMessage());
    });

    test('Should fail to create Market because missing name', async () => {
        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MissingParamException('name').getMessage());
    });

    test('Should fail to create Market because invalid profileId', async () => {

        const res: any = await testUtil.rpc(marketCommand, [marketAddCommand,
            false,
            marketData.name
            /*marketData.type,
            marketData.receiveKey,
            marketData.publishKey,
            market.Identity.id*/
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('profileId', 'number').getMessage());
    });

    test('Should fail to create Market because invalid name', async () => {

        const res: any = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            false
            /*marketData.type,
            marketData.receiveKey,
            marketData.publishKey,
            market.Identity.id*/
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('name', 'string').getMessage());
    });

    test('Should fail to create Market because invalid type', async () => {

        const res: any = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketData.name,
            false
            /*marketData.receiveKey,
            marketData.publishKey,
            market.Identity.id*/
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('type', 'string').getMessage());
    });

    test('Should fail to create Market because invalid receiveKey', async () => {

        const res: any = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketData.name,
            marketData.type,
            false,
            marketData.publishKey,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('receiveKey', 'string').getMessage());
    });

    test('Should fail to create Market because invalid publishKey', async () => {

        const res: any = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketData.name,
            marketData.type,
            marketData.receiveKey,
            true,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(400);
        expect(res.error.error.message).toBe(new InvalidParamException('publishKey', 'string').getMessage());
    });

    test('Should create a new market (MARKETPLACE)', async () => {

        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketData.name,
            marketData.type,
            marketData.receiveKey,
            marketData.publishKey,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Market = res.getBody()['result'];
        expect(result.name).toBe(marketData.name);
        expect(result.type).toBe(marketData.type);
        expect(result.receiveKey).toBe(marketData.receiveKey);
        expect(result.receiveAddress).toBeDefined();
        expect(result.publishKey).toBe(marketData.publishKey);
        expect(result.publishAddress).toBeDefined();
    });

    test('Should fail to create Market because duplicate name', async () => {
        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketData.name,
            marketData.type,
            marketData.receiveKey,
            marketData.publishKey,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(404);
        expect(res.error.error.message).toBe(new MessageException('Market with the name: ' + marketData.name + ' already exists.').getMessage());
    });

    test('Should create a new market (MARKETPLACE) with just a name', async () => {
        const marketName = 'TEST-4';
        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            marketName
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Market = res.getBody()['result'];
        expect(result.name).toBe(marketName);
        expect(result.receiveKey).toBe(result.publishKey);
    });

    test('Should create a new market (STOREFRONT_ADMIN)', async () => {
        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            storeFrontAdminData.name,
            storeFrontAdminData.type,
            storeFrontAdminData.receiveKey,
            storeFrontAdminData.publishKey,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Market = res.getBody()['result'];
        expect(result.name).toBe(storeFrontAdminData.name);
        expect(result.type).toBe(storeFrontAdminData.type);
        expect(result.receiveKey).toBe(storeFrontAdminData.receiveKey);
        expect(result.receiveAddress).toBeDefined();
        expect(result.publishKey).toBe(storeFrontAdminData.publishKey);
        expect(result.publishAddress).toBeDefined();
        expect(result.receiveKey).not.toBe(result.publishKey);
    });

    test('Should create a new market (STOREFRONT)', async () => {
        const res = await testUtil.rpc(marketCommand, [marketAddCommand,
            profile.id,
            storeFrontUserData.name,
            storeFrontUserData.type,
            storeFrontUserData.receiveKey,
            storeFrontUserData.publishKey,
            market.Identity.id
        ]);
        res.expectJson();
        res.expectStatusCode(200);
        const result: resources.Market = res.getBody()['result'];
        expect(result.name).toBe(storeFrontUserData.name);
        expect(result.type).toBe(storeFrontUserData.type);
        expect(result.receiveKey).toBe(storeFrontUserData.receiveKey);
        expect(result.receiveAddress).toBeDefined();
        expect(result.publishKey).toBe(storeFrontUserData.publishKey);
        expect(result.publishAddress).toBeDefined();
        expect(result.receiveKey).not.toBe(result.publishKey);
    });

});
