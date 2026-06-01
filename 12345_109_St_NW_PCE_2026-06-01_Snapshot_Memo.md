# KV CompLens Snapshot Memo

> DEMO MODE ONLY. Local synthetic sales calibrated against public assessment content. Analyst review required.

## Subject
- Address: 12345 109 St NW, Edmonton, AB
- Property type: Detached
- Living area: 2180 sq ft
- Lot size: 5800 sq ft
- Condition: Good

## Valuation
- Value range: $582,000 to $715,000
- Point estimate: $648,000
- Confidence: 74% Medium
- Effective sample size: 2.1

## Selected Comparables
| # | Address | Sale Price | Adjusted Value | Distance | Match |
| --- | --- | --- | --- | --- | --- |
| 1 | 12310 108 St NW | $530,000 | $619,000 | 0.3 km | 82 |
| 2 | 236 Larch Drive | $626,000 | $677,000 | 2.4 km | 71 |
| 3 | 253 Juniper Drive | $538,000 | $607,000 | 0.3 km | 67 |
| 4 | 253 Prairie Drive | $727,000 | $726,000 | 12.9 km | 58 |
| 5 | 236 Prairie Drive | $708,000 | $714,000 | 13.2 km | 55 |

## Source Scan
- Sources consolidated: 5
- Records scanned: 125
- Candidate pool: 80
- Selected comps: 5

## Memo
Subject Property Summary

12345 109 St NW, Edmonton, AB is analyzed as a Detached property with 4 beds, 3 baths, 2,180 sqft, 5,800 sqft lot, good condition, and 2 parking stalls.

Source Scan Summary

125 local demo records scanned; 80 candidate comps ranked; 5 selected for valuation. Synthetic sales / public assessment context. Not live MLS. Analyst review required.

Selected Comparable Sales

1. 12310 108 St NW, Edmonton: score 81.8/100; comparable probability 92%; energy quality 54%; source reliability 98%; normalized evidence weight 64%; sale $530,000; adjusted observation $619,000; Same property type: Detached. Inside preferred radius at 0.3 km. Living area inside size tolerance. Recent sale within 49 days. PCE-V2 probability 92%, energy quality 54%, source reliability 98%..
2. 236 Larch Drive, Edmonton: score 71.4/100; comparable probability 89%; energy quality 39%; source reliability 74%; normalized evidence weight 22%; sale $626,000; adjusted observation $677,000; Same property type: Detached. Inside preferred radius at 2.4 km. Living area inside size tolerance. Recent sale within 41 days. PCE-V2 probability 89%, energy quality 39%, source reliability 74%..
3. 253 Juniper Drive, Edmonton: score 66.5/100; comparable probability 82%; energy quality 26%; source reliability 74%; normalized evidence weight 13%; sale $538,000; adjusted observation $607,000; Property type differs: SemiDetached. Inside preferred radius at 0.3 km. 27% living-area variance. Recent sale within 130 days. PCE-V2 probability 82%, energy quality 26%, source reliability 74%..
4. 253 Prairie Drive, Sherwood Park: score 57.5/100; comparable probability 80%; energy quality 0%; source reliability 74%; normalized evidence weight 0%; sale $727,000; adjusted observation $726,000; Same property type: Detached. 12.9 km from subject. Living area inside size tolerance. Sale age is 314 days. PCE-V2 probability 80%, energy quality 0%, source reliability 74%..
5. 236 Prairie Drive, St. Albert: score 55.1/100; comparable probability 77%; energy quality 0%; source reliability 74%; normalized evidence weight 0%; sale $708,000; adjusted observation $714,000; Same property type: Detached. 13.2 km from subject. Living area inside size tolerance. Sale age is 284 days. PCE-V2 probability 77%, energy quality 0%, source reliability 74%..

Excluded / Lower-Ranked Candidates

- 117 Summit Drive: ranked lower because Stale sale date.
- 100 Summit Drive: ranked lower because Stale sale date.
- 11022 104 St NW: ranked lower because Stale sale date.
- 10715 124 St NW: ranked lower because Older sale.

Adjustment Summary

Adjustments include square footage, beds/baths, age, condition, parking, and lot size. Average total adjustment across selected comps is $42,800.

PCE-V2 Evidence Reconciliation

PCE-V2 treats subject value as a latent variable and each adjusted comparable sale as uncertain evidence. The valuation path uses comparable probability, evidence energy quality, Bayesian-style source reliability, robust price-per-square-foot outlier checks, precision weighting, effective sample size (2.1), evidence balance (56%), and a conformal-style residual buffer ($21,000). Weighted adjusted mean is $630,000, posterior midpoint is $648,000, and diagnostic model-fusion estimate is $661,000.

Indicated Value Range

Residual-buffered posterior range: $582,000 to $715,000, with point estimate $648,000.

Confidence and Risk Flags

74% Medium confidence. 5 comps used; effective sample size 2.1; average comparable probability 84%; adjusted value spread 20.5%; 9 risk flags across selected comps. Risk flags: Age or condition mismatch; Different property type; Older sale; Size mismatch; Stale sale date; Wide adjusted-value spread; Stale sale dates in selected set

Analyst Review Notes

This is deterministic underwriting support only. It is not an appraisal, not an automated credit decision, and not live MLS analysis.

Recommended Next Steps

Review the selected comps, confirm adjustment assumptions, verify any real-world source documents, and require analyst approval before relying on the memo in a lending file.

## Audit Events
- 2026-06-01T12:13:35.443Z | source_scan | CONFIRMED | 125 demo records scanned across 5 source buckets.
- 2026-06-01T12:13:35.443Z | ranking | CONFIRMED | 80 candidates ranked; 75 remain outside selected set.
- 2026-06-01T12:13:35.443Z | selection | CONFIRMED | 5 comparables selected for valuation.
- 2026-06-01T12:13:35.443Z | valuation | READY | Point estimate 648000; confidence 74%.
- 2026-06-01T12:13:35.443Z | memo | READY | Facts-only underwriting memo generated from snapshot evidence.