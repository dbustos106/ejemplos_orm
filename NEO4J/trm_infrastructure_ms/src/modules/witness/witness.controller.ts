import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { WitnessQueryOptionsDto } from './dto/witness-query-options.dto';
import { CreateWitnessDto } from './dto/create-witness.dto';
import { WitnessService } from './witness.service';

@Controller('witness')
export class WitnessController {
  constructor(private readonly witnessService: WitnessService) { }

  @Post()
  create(@Body() createDto: CreateWitnessDto) {
    return this.witnessService.create(createDto);
  }

  @Get()
  findAll(@Query() query: WitnessQueryOptionsDto) {
    return this.witnessService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.witnessService.findOne(id, query);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.witnessService.remove(id);
  }

}
