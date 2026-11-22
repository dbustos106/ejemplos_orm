import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { VotingQueryOptionsDto } from './dto/voting-query-options.dto';
import { CreateVotingDto } from './dto/create-voting.dto';
import { UpdateVotingDto } from './dto/update-voting.dto';
import { VotingService } from './voting.service';

@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) { }

  @Post()
  create(@Body() createDto: CreateVotingDto) {
    return this.votingService.create(createDto);
  }

  @Post(':votingId/participation/:partyId')
  @HttpCode(201)
  createParticipation(@Param('votingId') votingId: string, @Param('partyId') partyId: string) {
    return this.votingService.createParticipation(votingId, partyId);
  }

  @Post(':votingId/cover/:zoneId')
  @HttpCode(201)
  createCover(@Param('votingId') votingId: string, @Param('zoneId') zoneId: string) {
    return this.votingService.createCover(votingId, zoneId);
  }

  @Get()
  findAll(@Query() query: VotingQueryOptionsDto) {
    return this.votingService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.votingService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateVotingDto) {
    return this.votingService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.votingService.remove(id);
  }

}
