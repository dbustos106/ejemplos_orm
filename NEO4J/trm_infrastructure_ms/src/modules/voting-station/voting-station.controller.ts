import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VotingStationQueryOptionsDto } from './dto/voting-station-query-options';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { UpdateVotingStationDto } from './dto/update-voting-station.dto';
import { CreateVotingStationDto } from './dto/create-voting-station.dto';
import { VotingStationService } from './voting-station.service';

@Controller('voting-station')
export class VotingStationController {
  constructor(private readonly votingStationService: VotingStationService) { }

  @Post()
  create(@Body() createDto: CreateVotingStationDto) {
    return this.votingStationService.create(createDto);
  }

  @Get()
  findAll(@Query() query: VotingStationQueryOptionsDto) {
    return this.votingStationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.votingStationService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVotingStationDto) {
    return this.votingStationService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.votingStationService.remove(id);
  }

}
