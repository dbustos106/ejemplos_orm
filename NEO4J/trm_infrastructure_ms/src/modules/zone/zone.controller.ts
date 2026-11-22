import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZoneService } from './zone.service';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';

@Controller('zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) { }

  @Post()
  async create(@Body() createDto: CreateZoneDto) {
    return this.zoneService.create(createDto);
  }

  @Get('tree')
  async findAllTree(@Query() query: PaginationDto) {
    return this.zoneService.findAllTree(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.zoneService.findOne(id, query);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateZoneDto) {
    return this.zoneService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.zoneService.remove(id);
  }

}
