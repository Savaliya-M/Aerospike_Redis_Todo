import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AerospikeService } from './aerospike/aerospike.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AerospikeService],
})
export class AppModule {}
