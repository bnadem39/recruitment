package org.example.recrutment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = {
        "org.example.recrutment.entities.users",
        "org.example.recrutment.entities.candidatures",
        "org.example.recrutment.entities.gestionOffres",
        "org.example.recrutment.entities.gestionEntretiens",
        "org.example.recrutment.entities.formulairesAdaptatifs",
        "org.example.recrutment.entities.audit",
        "org.example.recrutment.entities.notification",
        "org.example.recrutment.entities.talentpool"
})
public class RecrutmentApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecrutmentApplication.class, args);
    }

}
