import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { PartyQueryOptionsDto } from './dto/party-query-options.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { CreatePartyDto } from './dto/create-party.dto';
import { PartyService } from './party.service';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) { }

  @Post()
  create(@Body() createDto: CreatePartyDto) {
    return this.partyService.create(createDto);
  }

  @Get()
  findAll(@Query() query: PartyQueryOptionsDto) {
    return this.partyService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: BaseQueryOptionsDto) {
    return this.partyService.findOne(id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePartyDto) {
    return this.partyService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.partyService.remove(id);
  }

}
