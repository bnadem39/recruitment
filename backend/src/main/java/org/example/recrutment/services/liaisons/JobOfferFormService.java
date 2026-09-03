package org.example.recrutment.services.liaisons;

import lombok.RequiredArgsConstructor;
import org.example.recrutment.entities.formulairesAdaptatifs.Form;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.liaisons.JobOfferForm;
import org.example.recrutment.entities.liaisons.JobOfferFormId;
import org.example.recrutment.repositories.liaisons.JobOfferFormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class JobOfferFormService {

    private final JobOfferFormRepository jobOfferFormRepository;
    private final JobOfferRepository jobOfferRepository;

    /**
     * Ajoute les associations demandées sans supprimer les associations
     * existantes d'une offre ou d'un formulaire.
     */
    public void addLinks(
            Form form,
            List<Long> jobOfferIds
    ) {
        if (jobOfferIds == null || jobOfferIds.isEmpty()) {
            return;
        }

        int displayOrder = 0;

        for (Long jobOfferId : jobOfferIds) {
            if (jobOfferId == null) {
                continue;
            }

            JobOffer jobOffer = jobOfferRepository
                    .findById(jobOfferId)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Offre introuvable : " + jobOfferId
                            )
                    );

            JobOfferFormId relationId =
                    new JobOfferFormId(
                            jobOffer.getId(),
                            form.getFormId()
                    );

            if (jobOfferFormRepository.existsById(relationId)) {
                continue;
            }

            JobOfferForm relation = JobOfferForm.builder()
                    .jobOffer(jobOffer)
                    .form(form)
                    .linkedAt(LocalDateTime.now())
                    .primaryForm(false)
                    .displayOrder(displayOrder++)
                    .required(true)
                    .build();

            jobOfferFormRepository.save(relation);
        }
    }
}