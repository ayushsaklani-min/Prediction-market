#!/usr/bin/env node
// Deterministic AI proxy (JavaScript version)
// Input (stdin JSON): { "eventId": str, "description": str, "timestamp": int, "chainId": int }
// Output includes verifier-compatible proof and commitment hash.

import { hexlify, keccak256, solidityPackedKeccak256, toUtf8Bytes } from 'ethers';
import { createHash } from 'crypto';

function keccak256Hash(data) {
  // Use ethers keccak256 for consistency with Solidity
  // keccak256 expects a BytesLike, so we convert string to bytes
  const dataBytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return keccak256(dataBytes);
}

function main() {
  let input = '';
  
  // Read from stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  
  process.stdin.on('end', () => {
    try {
      const payload = JSON.parse(input);
      const eventId = String(payload.eventId || '');
      const description = String(payload.description || '');
      const ts = parseInt(payload.timestamp || Math.floor(Date.now() / 1000));
      const chainId = parseInt(payload.chainId || 0);

      // Seed per spec (same as Python version)
      const seedInput = eventId + String(chainId) + String(ts);
      const seedHex = createHash('sha256').update(seedInput).digest('hex');
      
      // probability = (int(seed[:8]) % 80) + 10 => 10..89
      const prob = (parseInt(seedHex.substring(0, 8), 16) % 80) + 10;

      // explanation: 3 signals deterministic
      const wordCount = description.split(/\s+/).filter(w => w.length > 0).length;
      const keywords = ["ETH", "Bitcoin", "inflation", "Fed", "ETF", "AI", "sports"];
      const searchText = (eventId + ' ' + description).toLowerCase();
      const keywordWeight = keywords.reduce((count, k) => 
        count + (searchText.includes(k.toLowerCase()) ? 1 : 0), 0
      );
      const lengthSignal = Math.min(100, description.length);
      
      let explanation = (
        `Signals: words=${wordCount}, keywordWeight=${keywordWeight}, lengthSignal=${lengthSignal}. ` +
        `Deterministic seed=${seedHex.substring(0, 12)}`
      );
      
      if (explanation.length > 280) {
        explanation = explanation.substring(0, 280);
      }

      const outcome = prob >= 50 ? 1 : 0;
      const proofObject = {
        eventId,
        probability: prob,
        outcome,
        explanation,
        chainId,
        timestamp: ts,
      };
      const proofJson = JSON.stringify(proofObject);
      const proof = hexlify(toUtf8Bytes(proofJson));
      const proofHash = keccak256(proof);

      // VerifierV2(Hash): keccak256(abi.encodePacked(outcome, proof))
      const aiHash = solidityPackedKeccak256(['uint8', 'bytes'], [outcome, proof]);
      const ipfsCid = `sha256:${createHash('sha256').update(proofJson).digest('hex')}`;

      const result = {
        probability: prob,
        explanation: explanation,
        outcome,
        proof,
        proofHash,
        aiHash,
        ipfsCid,
      };

      console.log(JSON.stringify(result));
    } catch (error) {
      console.error(JSON.stringify({ error: error.message }));
      process.exit(1);
    }
  });
}

main();

