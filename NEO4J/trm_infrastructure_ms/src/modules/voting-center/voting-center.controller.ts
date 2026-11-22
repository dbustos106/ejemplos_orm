import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { VotingCenterQueryOptionsDto } from './dto/voting-center-query-options';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { UpdateVotingCenterDto } from './dto/update-voting-center.dto';
import { CreateVotingCenterDto } from './dto/create-voting-center.dto';
import { VotingCenterService } from './voting-center.service';

@Controller('voting-center')
export class VotingCenterController {
  constructor(private readonly votingCenterService: VotingCenterService) { }

  @Post()
  create(@Body() createDto: CreateVotingCenterDto) {
    return this.votingCenterService.create(createDto);
  }

  @Get()
  findAll(@Query() query: VotingCenterQueryOptionsDto) {
    return this.votingCenterService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.votingCenterService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVotingCenterDto) {
    return this.votingCenterService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.votingCenterService.remove(id);
  }

}
