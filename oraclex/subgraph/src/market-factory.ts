import { MarketCreated, MarketClosed } from "../generated/MarketFactoryV2/MarketFactoryV2";
import { Market, User, GlobalStats } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleMarketCreated(event: MarketCreated): void {
  let market = new Market(event.params.marketId.toHexString());
  
  market.marketId = event.params.marketId;
  market.eventId = event.params.eventId;
  market.description = event.params.description;
  market.category = event.params.category;
  market.tags = [];
  market.closeTimestamp = event.params.closeTimestamp;
  market.resolutionTimestamp = BigInt.fromI32(0);
  market.creator = getOrCreateUser(event.params.creator).id;
  market.createdAt = event.block.timestamp;
  market.active = true;
  market.settled = false;
  market.winningSide = null;
  
  market.yesPool = BigInt.fromI32(0);
  market.noPool = BigInt.fromI32(0);
  market.totalVolume = BigInt.fromI32(0);
  market.totalFees = BigInt.fromI32(0);
  market.totalLiquidity = BigInt.fromI32(0);
  
  market.yesPrice = BigInt.fromI32(5000).toBigDecimal().div(BigInt.fromI32(10000).toBigDecimal());
  market.noPrice = BigInt.fromI32(5000).toBigDecimal().div(BigInt.fromI32(10000).toBigDecimal());
  
  market.updatedAt = event.block.timestamp;
  
  market.save();
  
  updateGlobalStats(event.block.timestamp, true, false, false, BigInt.fromI32(0), BigInt.fromI32(0));
}

export function handleMarketClosed(event: MarketClosed): void {
  let market = Market.load(event.params.marketId.toHexString());
  if (market) {
    market.active = false;
    market.updatedAt = event.block.timestamp;
    market.save();
  }
}

function getOrCreateUser(address: Bytes): User {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalVolume = BigInt.fromI32(0);
    user.totalTrades = 0;
    user.createdAt = BigInt.fromI32(0);
    user.save();
    
    updateGlobalStats(BigInt.fromI32(0), false, false, true, BigInt.fromI32(0), BigInt.fromI32(0));
  }
  return user;
}

function updateGlobalStats(
  timestamp: BigInt,
  newMarket: boolean,
  newTrade: boolean,
  newUser: boolean,
  volume: BigInt,
  fees: BigInt
): void {
  let stats = GlobalStats.load("global");
  if (!stats) {
    stats = new GlobalStats("global");
    stats.totalMarkets = 0;
    stats.totalVolume = BigInt.fromI32(0);
    stats.totalTrades = 0;
    stats.totalUsers = 0;
    stats.totalFees = BigInt.fromI32(0);
  }
  
  if (newMarket) stats.totalMarkets += 1;
  if (newTrade) stats.totalTrades += 1;
  if (newUser) stats.totalUsers += 1;
  stats.totalVolume = stats.totalVolume.plus(volume);
  stats.totalFees = stats.totalFees.plus(fees);
  stats.updatedAt = timestamp;
  
  stats.save();
}
