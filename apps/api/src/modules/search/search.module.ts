import { Module } from '@nestjs/common';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { SearchListener } from './search.listener.js';

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchListener],
  exports: [SearchService],
})
export class SearchModule {}
