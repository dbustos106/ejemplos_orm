import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { UpdateVotingCenterDto } from '../voting-center/dto/update-voting-center.dto';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { ManagerQueryOptionsDto } from './dto/manager-query-options.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { ManagerService } from './manager.service';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) { }

  @Post()
  create(@Body() createDto: CreateManagerDto) {
    return this.managerService.create(createDto);
  }

  @Get()
  findAll(@Query() query: ManagerQueryOptionsDto) {
    return this.managerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.managerService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVotingCenterDto) {
    return this.managerService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.managerService.remove(id);
  }

}
