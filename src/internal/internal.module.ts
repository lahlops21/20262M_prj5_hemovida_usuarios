import { Module } from '@nestjs/common';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';

@Module({
  controllers: [InternalController],
  providers: [InternalService, ServiceKeyGuard],
})
export class InternalModule {}
