package org.example.recrutment.services.gestionOffres;

import org.example.recrutment.dto.gestionOffres.JobOfferRequestDTO;
import org.example.recrutment.dto.gestionOffres.JobOfferResponseDTO;
import org.example.recrutment.entities.gestionOffres.ContactType;
import org.example.recrutment.entities.gestionOffres.JobOffer;
import org.example.recrutment.entities.gestionOffres.OfferStatus;
import org.example.recrutment.repositories.formulairesAdaptatifs.FormRepository;
import org.example.recrutment.repositories.gestionOffres.JobOfferRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class JobOfferServiceImplTest {
    private final JobOfferRepository jobOffers = mock(JobOfferRepository.class);
    private final FormRepository forms = mock(FormRepository.class);
    private final JobOfferServiceImpl service = new JobOfferServiceImpl(jobOffers, forms);

    @Test
    void getAllReturnsNullFormIdWhenOfferHasNoForm() {
        JobOffer offer = JobOffer.builder()
                .id(7L)
                .title("Charge de clientele")
                .contractType(ContactType.CDI)
                .status(OfferStatus.DRAFT)
                .publicationDate(LocalDate.of(2026, 8, 1))
                .build();
        when(jobOffers.findAll()).thenReturn(List.of(offer));

        List<JobOfferResponseDTO> result = service.getAll();

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.getId()).isEqualTo(7L);
            assertThat(dto.getFormId()).isNull();
        });
    }

    @Test
    void createAllowsOfferWithoutForm() {
        JobOfferRequestDTO request = JobOfferRequestDTO.builder()
                .title("Charge de clientele")
                .contractType(ContactType.CDI)
                .status(OfferStatus.DRAFT)
                .build();
        when(jobOffers.save(any(JobOffer.class))).thenAnswer(invocation -> {
            JobOffer saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });

        JobOfferResponseDTO result = service.create(request);

        assertThat(result.getId()).isEqualTo(9L);
        assertThat(result.getFormId()).isNull();
        verifyNoInteractions(forms);
    }
}
