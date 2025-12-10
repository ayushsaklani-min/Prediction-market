import { OutcomeProposed, OutcomeChallenged, MarketFinalized } from "../generated/OracleAdapterV2/OracleAdapterV2";
import { Outcome, Dispute, Market } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleOutcomeProposed(event: OutcomeProposed): void {
  let outcome = new Outcome(event.params.marketId.toHexString());
  outcome.market = event.params.marketId.toHexString();
  outcome.result = event.params.result;
  outcome.oracle = event.params.oracle;
  outcome.timestamp = event.block.timestamp;
  outcome.status = 1; // Proposed
  outcome.proof = null;
  outcome.save();
}

export function handleOutcomeChallenged(event: OutcomeChallenged): void {
  let outcome = Outcome.load(event.params.marketId.toHexString());
  if (outcome) {
    outcome.status = 2; // Challenged
    outcome.save();
  }
  
  let dispute = new Dispute(event.params.marketId.toHexString());
  dispute.outcome = event.params.marketId.toHexString();
  dispute.disputer = event.params.disputer;
  dispute.proposedResult = event.params.proposedResult;
  dispute.stake = BigInt.fromI32(0);
  dispute.timestamp = event.block.timestamp;
  dispute.resolved = false;
  dispute.valid = false;
  dispute.save();
}

export function handleMarketFinalized(event: MarketFinalized): void {
  let outcome = Outcome.load(event.params.marketId.toHexString());
  if (outcome) {
    outcome.status = 3; // Finalized
    outcome.result = event.params.result;
    outcome.save();
  }
  
  let market = Market.load(event.params.marketId.toHexString());
  if (market) {
    market.settled = true;
    market.winningSide = event.params.result;
    market.save();
  }
}
