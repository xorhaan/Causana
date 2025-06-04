package com.causana.gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/submit-job")
public class SubmitJobController {

    @Value("${runner.service.url}")
    private String runnerServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> submitJob(
            @RequestParam("file") MultipartFile file,
            @RequestParam("method") String method,
            @RequestParam("lags") int lags,
            @RequestParam("window") int window
    ) throws IOException {

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        body.add("method", method);
        body.add("lags", lags);
        body.add("window", window);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        // Sned request to Go job runner
        String url = runnerServiceUrl + "/run-job";
        ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
