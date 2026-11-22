import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from '../queues.constants.js';
import { SearchService } from '../../search/search.service.js';

@Processor(QUEUES.SEARCH_SYNC)
export class SearchSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchSyncProcessor.name);

  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<{ productId: string }>): Promise<any> {
    this.logger.log(`Processing search sync job ${job.id} (${job.name}) for product ${job.data.productId}`);

    switch (job.name) {
      case JOBS.SEARCH_SYNC.INDEX_PRODUCT:
        await this.searchService.indexProduct(job.data.productId);
        this.logger.log(`Indexed product ${job.data.productId} into search engine`);
        return { indexed: true, productId: job.data.productId };

      case JOBS.SEARCH_SYNC.DELETE_PRODUCT:
        await this.searchService.deleteProduct(job.data.productId);
        this.logger.log(`Deleted product ${job.data.productId} from search engine`);
        return { deleted: true, productId: job.data.productId };

      default:
        this.logger.warn(`Unrecognized search sync job name '${job.name}'`);
        return null;
    }
  }
}
