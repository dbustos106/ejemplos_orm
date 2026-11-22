import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { PaginationQueryOptionsDto } from 'src/common/dto/pagination-query-options.dto';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { CreateVotingTypeDto } from './dto/create-voting-type.dto';
import { VotingTypeService } from './voting-type.service';
import { UpdateVotingTypeDto } from './dto/update-voting-type.dto';

@Controller('voting-type')
export class VotingTypeController {
  constructor(private readonly votingTypeService: VotingTypeService) { }

  @Post()
  create(@Body() createDto: CreateVotingTypeDto) {
    return this.votingTypeService.create(createDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryOptionsDto) {
    return this.votingTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.votingTypeService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVotingTypeDto) {
    return this.votingTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.votingTypeService.remove(id);
  }

}
