package com.company.turbohireclone.backend.dto.admin;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StageCountDTO {

    private String stage;
    private Long count;

    private Double conversionRate; // %
    private Double dropOffRate;    // %
    private Boolean bottleneck;
    private Long moved;     // candidates moved to next stage
    private Long rejected;  // candidates rejected at this stage
}