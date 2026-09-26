package com.pfc.notus.notificacao.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableConfigurationProperties({ResendProperties.class, NotificacaoProperties.class})
public class NotificacaoConfig {
}
