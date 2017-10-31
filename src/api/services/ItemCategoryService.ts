import * as Bookshelf from 'bookshelf';
import { inject, named } from 'inversify';
import { Logger as LoggerType } from '../../core/Logger';
import { Types, Core, Targets } from '../../constants';
import { validate, request } from '../../core/api/Validate';
import { NotFoundException } from '../exceptions/NotFoundException';
import { ItemCategoryRepository } from '../repositories/ItemCategoryRepository';
import { ItemCategory } from '../models/ItemCategory';
import { ItemCategoryCreateRequest } from '../requests/ItemCategoryCreateRequest';
import { ItemCategoryUpdateRequest } from '../requests/ItemCategoryUpdateRequest';
import { RpcRequest } from '../requests/RpcRequest';


export class ItemCategoryService {

    public log: LoggerType;

    constructor(
        @inject(Types.Repository) @named(Targets.Repository.ItemCategoryRepository) public itemCategoryRepo: ItemCategoryRepository,
        @inject(Types.Core) @named(Core.Logger) public Logger: typeof LoggerType
    ) {
        this.log = new Logger(__filename);
    }

    @validate()
    public async rpcFindAll( @request(RpcRequest) data: any): Promise<Bookshelf.Collection<ItemCategory>> {
        return this.findAll();
    }

    public async findAll(): Promise<Bookshelf.Collection<ItemCategory>> {
        return this.itemCategoryRepo.findAll();
    }

    @validate()
    public async rpcFindOne( @request(RpcRequest) data: any): Promise<ItemCategory> {
        return this.findOne(data.params[0]);
    }

    public async findOne(id: number, withRelated: boolean = true): Promise<ItemCategory> {
        const itemCategory = await this.itemCategoryRepo.findOne(id, withRelated);
        if (itemCategory === null) {
            this.log.warn(`ItemCategory with the id=${id} was not found!`);
            throw new NotFoundException(id);
        }
        return itemCategory;
    }

    @validate()
    public async rpcCreate( @request(RpcRequest) data: any): Promise<ItemCategory> {
        return this.create({
            data: data.params // TODO: convert your params to ItemCategoryCreateRequest
        });
    }

    @validate()
    public async create( @request(ItemCategoryCreateRequest) body: any): Promise<ItemCategory> {

        // TODO: extract and remove related models from request
        // const itemCategoryRelated = body.related;
        // delete body.related;

        // If the request body was valid we will create the itemCategory
        const itemCategory = await this.itemCategoryRepo.create(body);

        // TODO: create related models
        // itemCategoryRelated._id = itemCategory.Id;
        // await this.itemCategoryRelatedService.create(itemCategoryRelated);

        // finally find and return the created itemCategory
        const newItemCategory = await this.findOne(itemCategory.id);
        return newItemCategory;
    }

    @validate()
    public async rpcUpdate( @request(RpcRequest) data: any): Promise<ItemCategory> {
        return this.update(data.params[0], {
            data: data.params[1] // TODO: convert your params to ItemCategoryUpdateRequest
        });
    }

    @validate()
    public async update(id: number, @request(ItemCategoryUpdateRequest) body: any): Promise<ItemCategory> {

        // find the existing one without related
        const itemCategory = await this.findOne(id, false);

        // set new values
        itemCategory.Name = body.name;
        itemCategory.Description = body.description;

        // update itemCategory record
        const updatedItemCategory = await this.itemCategoryRepo.update(id, itemCategory.toJSON());

        // TODO: yes, this is stupid
        // TODO: find related record and delete it
        // let itemCategoryRelated = updatedItemCategory.related('ItemCategoryRelated').toJSON();
        // await this.itemCategoryService.destroy(itemCategoryRelated.id);

        // TODO: recreate related data
        // itemCategoryRelated = body.itemCategoryRelated;
        // itemCategoryRelated._id = itemCategory.Id;
        // const createdItemCategory = await this.itemCategoryService.create(itemCategoryRelated);

        // TODO: finally find and return the updated itemCategory
        // const newItemCategory = await this.findOne(id);
        // return newItemCategory;

        return updatedItemCategory;
    }

    @validate()
    public async rpcDestroy( @request(RpcRequest) data: any): Promise<void> {
        return this.destroy(data.params[0]);
    }

    public async destroy(id: number): Promise<void> {
        await this.itemCategoryRepo.destroy(id);
    }

}