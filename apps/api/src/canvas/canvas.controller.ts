import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guard/jwt-auth.guard';
import { CanvasService } from './canvas.service';
import { LoginedUser } from '@/utils/decorators/user.decorator';
import { canvasPO2DTO } from '@/canvas/canvas.dto';
import { buildSuccessResponse } from '@/utils';
import {
  User,
  UpsertCanvasRequest,
  DeleteCanvasRequest,
  AutoNameCanvasRequest,
  AutoNameCanvasResponse,
  DuplicateCanvasRequest,
  CanvasNode,
  CanvasFromAgentRequest,
} from '@refly-packages/openapi-schema';
import { genUniqueId } from '@refly-packages/utils';

@Controller('v1/canvas')
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listCanvases(
    @LoginedUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    const canvases = await this.canvasService.listCanvases(user, { page, pageSize });
    return buildSuccessResponse(canvases.map(canvasPO2DTO));
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail')
  async getCanvasDetail(@LoginedUser() user: User, @Query('canvasId') canvasId: string) {
    const canvas = await this.canvasService.getCanvasDetail(user, canvasId);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Get('data')
  async getCanvasData(@LoginedUser() user: User, @Query('canvasId') canvasId: string) {
    const data = await this.canvasService.getCanvasRawData(user, canvasId);
    return buildSuccessResponse(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('duplicate')
  async duplicateCanvas(@LoginedUser() user: User, @Body() body: DuplicateCanvasRequest) {
    const canvas = await this.canvasService.duplicateCanvas(user, body, { checkOwnership: true });
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createCanvas(@LoginedUser() user: User, @Body() body: UpsertCanvasRequest) {
    const canvas = await this.canvasService.createCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-from-agent')
  async agentCanvas(@LoginedUser() user: User, @Body() body: CanvasFromAgentRequest) {
    const canvas = await this.canvasService.createCanvas(user, { title: 'Agent Canvas' });
    const node: CanvasNode & { id: string; position: { x: number; y: number } } = {
      id: `node-${genUniqueId()}`,
      type: 'planner',
      position: { x: 0, y: 0 },
      data: {
        title: body.query,
        entityId: '',
        metadata: {
          originalInput: body,
        },
      },
    };
    await this.canvasService.addNodeToCanvas(user, canvas.canvasId, node satisfies CanvasNode);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('update')
  async updateCanvas(@LoginedUser() user: User, @Body() body: UpsertCanvasRequest) {
    const canvas = await this.canvasService.updateCanvas(user, body);
    return buildSuccessResponse(canvasPO2DTO(canvas));
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete')
  async deleteCanvas(@LoginedUser() user: User, @Body() body: DeleteCanvasRequest) {
    await this.canvasService.deleteCanvas(user, body);
    return buildSuccessResponse({});
  }

  @UseGuards(JwtAuthGuard)
  @Post('autoName')
  async autoNameCanvas(
    @LoginedUser() user: User,
    @Body() body: AutoNameCanvasRequest,
  ): Promise<AutoNameCanvasResponse> {
    const data = await this.canvasService.autoNameCanvas(user, body);
    return buildSuccessResponse(data);
  }
}
