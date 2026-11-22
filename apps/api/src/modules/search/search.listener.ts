import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchService } from './search.service.js';

export interface ProductEventPayload {
  productId: string;
}

@Injectable()
export class SearchListener {
  private readonly logger = new Logger(SearchListener.name);

  constructor(private readonly searchService: SearchService) {}

  @OnEvent('catalog.product.created', { async: true })
  async handleProductCreated(payload: ProductEventPayload) {
    this.logger.debug(`Received catalog.product.created event for: ${payload.productId}`);
    await this.searchService.indexProduct(payload.productId);
  }

  @OnEvent('catalog.product.updated', { async: true })
  async handleProductUpdated(payload: ProductEventPayload) {
    this.logger.debug(`Received catalog.product.updated event for: ${payload.productId}`);
    await this.searchService.indexProduct(payload.productId);
  }

  @OnEvent('catalog.product.deleted', { async: true })
  async handleProductDeleted(payload: ProductEventPayload) {
    this.logger.debug(`Received catalog.product.deleted event for: ${payload.productId}`);
    await this.searchService.deleteProduct(payload.productId);
  }
}
