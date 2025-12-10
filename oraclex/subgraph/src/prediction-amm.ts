import { Trade as TradeEvent, MarketSettled, LiquidityAdded, LiquidityRemoved } from "../generated/PredictionAMM/PredictionAMM";
import { Market, Trade, Position, User, LiquidityPosition, GlobalStats } from "../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

export function handleTrade(event: TradeEvent): void {
  let market = Market.load(event.params.marketId.toHexString());
  if (!market) return;
  
  let user = getOrCreateUser(event.params.trader);
  
  // Create trade entity
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let trade = new Trade(tradeId);
  trade.market = market.id;
  trade.trader = user.id;
  trade.side = event.params.side;
  trade.isBuy = event.params.isBuy;
  trade.amountIn = event.params.amountIn;
  trade.sharesOut = event.params.sharesOut;
  trade.fee = event.params.fee;
  trade.timestamp = event.block.timestamp;
  trade.txHash = event.transaction.hash;
  
  // Calculate price
  if (event.params.isBuy) {
    trade.price = event.params.amountIn.toBigDecimal().div(event.params.sharesOut.toBigDecimal());
  } else {
    trade.price = event.params.sharesOut.toBigDecimal().div(event.params.amountIn.toBigDecimal());
  }
  
  trade.save();
  
  // Update market stats
  market.totalVolume = market.totalVolume.plus(event.params.amountIn);
  market.totalFees = market.totalFees.plus(event.params.fee);
  market.updatedAt = event.block.timestamp;
  market.save();
  
  // Update user position
  updatePosition(market, user, event.params.side, event.params.sharesOut, event.params.isBuy, event.block.timestamp);
  
  // Update user stats
  user.totalVolume = user.totalVolume.plus(event.params.amountIn);
  user.totalTrades += 1;
  user.save();
  
  // Update global stats
  updateGlobalStats(event.block.timestamp, false, true, false, event.params.amountIn, event.params.fee);
}

export function handleMarketSettled(event: MarketSettled): void {
  let market = Market.load(event.params.marketId.toHexString());
  if (market) {
    market.settled = true;
    market.winningSide = event.params.winningSide;
    market.active = false;
    market.updatedAt = event.block.timestamp;
    market.save();
  }
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  let market = Market.load(event.params.marketId.toHexString());
  if (!market) return;
  
  let user = getOrCreateUser(event.params.provider);
  
  let positionId = event.params.marketId.toHexString() + "-" + event.params.provider.toHexString();
  let position = LiquidityPosition.load(positionId);
  
  if (!position) {
    position = new LiquidityPosition(positionId);
    position.market = market.id;
    position.provider = user.id;
    position.lpShares = BigInt.fromI32(0);
    position.yesAmount = BigInt.fromI32(0);
    position.noAmount = BigInt.fromI32(0);
    position.createdAt = event.block.timestamp;
  }
  
  position.lpShares = position.lpShares.plus(event.params.lpShares);
  position.yesAmount = position.yesAmount.plus(event.params.yesAmount);
  position.noAmount = position.noAmount.plus(event.params.noAmount);
  position.updatedAt = event.block.timestamp;
  position.save();
  
  market.yesPool = market.yesPool.plus(event.params.yesAmount);
  market.noPool = market.noPool.plus(event.params.noAmount);
  market.totalLiquidity = market.yesPool.plus(market.noPool);
  market.updatedAt = event.block.timestamp;
  market.save();
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  let market = Market.load(event.params.marketId.toHexString());
  if (!market) return;
  
  let positionId = event.params.marketId.toHexString() + "-" + event.params.provider.toHexString();
  let position = LiquidityPosition.load(positionId);
  
  if (position) {
    position.lpShares = position.lpShares.minus(event.params.lpShares);
    position.yesAmount = position.yesAmount.minus(event.params.yesAmount);
    position.noAmount = position.noAmount.minus(event.params.noAmount);
    position.updatedAt = event.block.timestamp;
    position.save();
  }
  
  market.yesPool = market.yesPool.minus(event.params.yesAmount);
  market.noPool = market.noPool.minus(event.params.noAmount);
  market.totalLiquidity = market.yesPool.plus(market.noPool);
  market.updatedAt = event.block.timestamp;
  market.save();
}

function updatePosition(
  market: Market,
  user: User,
  side: i32,
  shares: BigInt,
  isBuy: boolean,
  timestamp: BigInt
): void {
  let positionId = market.id + "-" + user.id + "-" + side.toString();
  let position = Position.load(positionId);
  
  if (!position) {
    position = new Position(positionId);
    position.market = market.id;
    position.user = user.id;
    position.side = side;
    position.shares = BigInt.fromI32(0);
    position.averagePrice = BigInt.fromI32(0).toBigDecimal();
    position.realizedPnL = BigInt.fromI32(0);
    position.unrealizedPnL = BigInt.fromI32(0);
  }
  
  if (isBuy) {
    position.shares = position.shares.plus(shares);
  } else {
    position.shares = position.shares.minus(shares);
  }
  
  position.updatedAt = timestamp;
  position.save();
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
