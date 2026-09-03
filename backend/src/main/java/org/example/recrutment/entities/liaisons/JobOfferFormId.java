package org.example.recrutment.entities.liaisons;

import java.io.Serializable;
import java.util.Objects;

public class JobOfferFormId implements Serializable {

    private Long jobOffer;
    private Long form;

    public JobOfferFormId() {
    }

    public JobOfferFormId(
            Long jobOffer,
            Long form
    ) {
        this.jobOffer = jobOffer;
        this.form = form;
    }

    public Long getJobOffer() {
        return jobOffer;
    }

    public void setJobOffer(Long jobOffer) {
        this.jobOffer = jobOffer;
    }

    public Long getForm() {
        return form;
    }

    public void setForm(Long form) {
        this.form = form;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (!(object instanceof JobOfferFormId other)) {
            return false;
        }

        return Objects.equals(jobOffer, other.jobOffer)
                && Objects.equals(form, other.form);
    }

    @Override
    public int hashCode() {
        return Objects.hash(jobOffer, form);
    }
}