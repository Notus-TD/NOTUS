package com.pfc.notus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class NotusApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotusApplication.class, args);
    }
}
