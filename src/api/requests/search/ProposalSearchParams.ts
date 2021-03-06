// Copyright (c) 2017-2020, The Particl Market developers
// Distributed under the GPL software license, see the accompanying
// file COPYING or https://github.com/particl/particl-market/blob/develop/LICENSE

import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator';
import { RequestBody } from '../../../core/api/RequestBody';
import { SearchOrder } from '../../enums/SearchOrder';
import * as _ from 'lodash';
import { ProposalCategory } from '../../enums/ProposalCategory';

// tslint:disable:variable-name
export class ProposalSearchParams extends RequestBody {

    @IsEnum(SearchOrder)
    public order: SearchOrder = SearchOrder.ASC;

    @IsEnum(ProposalCategory)
    public category: ProposalCategory;

    public market: string;

    // rename these for clarity?
    public timeStart: number | string;      // endAfter
    public timeEnd: number | string;        // endBefore

    public hasFinalResult: boolean;
}
// tslint:enable:variable-name
