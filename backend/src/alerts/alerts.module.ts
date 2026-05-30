import { Module } from "@nestjs/common";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";

@Module({
  imports: [RiskEngineModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
