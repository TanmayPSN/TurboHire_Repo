package com.company.turbohireclone.backend.controller;

import com.company.turbohireclone.backend.dto.admin.AdminDashboardResponse;
import com.company.turbohireclone.backend.services.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard(
            @RequestParam(required = false) Long jobId
    ) {
        return adminAnalyticsService.getFullDashboard(jobId);
    }


}