import { inject, named } from 'inversify';
import { controller, httpGet, httpPost, httpPut, httpDelete, response, requestBody, requestParam, queryParam } from 'inversify-express-utils';
import { Types, Core, Targets } from '../../constants';
import { app } from '../../app';
import { ItemImageService } from '../services/ItemImageService';
import { Logger as LoggerType } from '../../core/Logger';
import sharp = require('sharp');
import * as _ from 'lodash';
import { RpcController } from './RpcController';
import { Commands } from '../commands/CommandEnumType';
import { ImageDataProtocolType } from '../enums/ImageDataProtocolType';

// Get middlewares
const restApi = app.IoC.getNamed<interfaces.Middleware>(Types.Middleware, Targets.Middleware.AuthenticateMiddleware);

@controller('/item-images', restApi.use)
export class ItemImageController {

    public log: LoggerType;

    constructor(
        @inject(Types.Service) @named(Targets.Service.ItemImageService) private itemImageService: ItemImageService,
        @inject(Types.Controller) @named(Targets.Controller.RpcController) private rpcController: RpcController,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType) {
        this.log = new Logger(__filename);
    }

    @httpGet('/')
    public async findAll( @response() res: myExpress.Response): Promise<any> {
        const itemImages = await this.itemImageService.findAll();
        this.log.debug('findAll: ', JSON.stringify(itemImages, null, 2));
        return res.found(itemImages.toJSON());
    }

    @httpPost('/')
    public async create( @response() res: myExpress.Response, @requestBody() body: any): Promise<any> {
        const itemImage = await this.itemImageService.create(body);
        this.log.debug('create: ', JSON.stringify(itemImage, null, 2));
        return res.created(itemImage.toJSON());
    }

    @httpGet('/:id')
    public async findOne( @response() res: myExpress.Response, @requestParam('id') id: string): Promise<any> {
        const itemImage = await this.itemImageService.findOne(parseInt(id, 10));
        this.log.debug('findOne: ', JSON.stringify(itemImage, null, 2));
        return res.found(itemImage.toJSON());
    }

    @httpPut('/:id')
    public async update( @response() res: myExpress.Response, @requestParam('id') id: string, @requestBody() body: any): Promise<any> {
        const itemImage = await this.itemImageService.update(parseInt(id, 10), body);
        this.log.debug('update: ', JSON.stringify(itemImage, null, 2));
        return res.updated(itemImage.toJSON());
    }

    @httpDelete('/:id')
    public async destroy( @response() res: myExpress.Response, @requestParam('id') id: string): Promise<any> {
        await this.itemImageService.destroy(parseInt(id, 10));
        this.log.debug('destroy: ', parseInt(id, 10));
        return res.destroyed();
    }

    @httpGet('/:id/:imageVersion')
    public async publishImage( @response() res: myExpress.Response, @requestParam('id') id: string, @requestParam('imageVersion')
      imageVersion: string): Promise<any> {

      // find the itemImage by id
      const itemImage = await this.itemImageService.findOne(parseInt(id, 10));

      const itemImageResult = itemImage.toJSON();

      // search the itemImageData like params image version
      const imgVersion = await _.find(itemImageResult.ItemImageDatas, data => data['imageVersion'] === imageVersion);

      if (itemImage === null || itemImageResult.ItemImageDatas.length === 0 || !imgVersion) {
        res.status(404).send('Image Not found');
      } else {
        const dataBuffer = new Buffer(imgVersion['data'], 'base64');
        const imageBuffer = sharp(dataBuffer);
        const newInfo = await imageBuffer.metadata();
        res.setHeader('Content-Disposition', 'filename=' + imageVersion + '.'
          + newInfo.format );
        res.send(dataBuffer);
      }
    }

    @httpPost('/template/:templateId')
    public async uploadImage( @response() res: myExpress.Response, @requestParam('templateId') templateId: string,
        @queryParam('image') image: any): Promise<any> {
        return this.rpcController.handleRPC(res, {
            method: Commands.ITEMIMAGE_ROOT.commandName,
            params: [Commands.ITEMIMAGE_ADD.commandName, templateId, 'TODO:random', ImageDataProtocolType.LOCAL, 'BASE64', image],
            id: 1
        });
    }
}

