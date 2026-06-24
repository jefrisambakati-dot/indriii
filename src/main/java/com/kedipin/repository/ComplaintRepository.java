package com.kedipin.repository;

import com.kedipin.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findTop30ByUserIdOrderByCreatedAtDesc(Long userId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
}
