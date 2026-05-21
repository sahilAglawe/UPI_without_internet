package com.demo.upimesh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the offline UPI mesh demo.
 *
 * Run from terminal:
 *   ./mvnw spring-boot:run        (Linux/Mac)
 *   mvnw.cmd spring-boot:run      (Windows — builds React UI into the JAR)
 *
 * Dev UI (hot reload): cd frontend && npm run dev  →  http://localhost:5173
 * The default browser opens at http://localhost:8080 (or set upi.mesh.browser-url for Vite)
 */
@SpringBootApplication
public class UpiMeshApplication {
    public static void main(String[] args) {
        SpringApplication.run(UpiMeshApplication.class, args);
    }
}
