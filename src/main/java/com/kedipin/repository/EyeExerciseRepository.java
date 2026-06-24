package com.kedipin.repository;

import com.kedipin.entity.EyeExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EyeExerciseRepository extends JpaRepository<EyeExercise, Long> {
}
