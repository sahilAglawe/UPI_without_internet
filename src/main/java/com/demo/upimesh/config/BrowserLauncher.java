package com.demo.upimesh.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

import java.awt.Desktop;
import java.net.URI;

/**
 * Opens the dashboard in the OS default browser once the server is ready.
 */
@Configuration
@ConditionalOnProperty(name = "upi.mesh.open-browser-on-start", havingValue = "true", matchIfMissing = true)
public class BrowserLauncher {

    private static final Logger log = LoggerFactory.getLogger(BrowserLauncher.class);

    private final Environment environment;

    public BrowserLauncher(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void openBrowser() {
        String configured = environment.getProperty("upi.mesh.browser-url", "").trim();
        String url = configured.isEmpty()
                ? "http://localhost:" + environment.getProperty("local.server.port", "8080")
                : configured;
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
            } else {
                openWithOsCommand(url);
            }
            log.info("Opened dashboard in default browser: {}", url);
        } catch (Exception e) {
            log.warn("Could not open browser automatically. Open {} manually.", url);
        }
    }

    private void openWithOsCommand(String url) throws Exception {
        String os = System.getProperty("os.name", "").toLowerCase();
        ProcessBuilder pb;
        if (os.contains("win")) {
            pb = new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url);
        } else if (os.contains("mac")) {
            pb = new ProcessBuilder("open", url);
        } else {
            pb = new ProcessBuilder("xdg-open", url);
        }
        pb.start();
    }
}
