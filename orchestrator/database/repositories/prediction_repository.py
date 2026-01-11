"""
Prediction Repository - Data access layer for ADMET predictions

Handles storage and retrieval of ADMET (Absorption, Distribution, Metabolism,
Excretion, Toxicity) predictions with flexible JSONB schema.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Dict, Any
import uuid

from database.models import ADMETPrediction, Molecule


class PredictionRepository:
    """Repository for ADMET prediction operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, prediction_data: Dict[str, Any]) -> ADMETPrediction:
        """
        Create a new ADMET prediction.

        Args:
            prediction_data: Dictionary with keys:
                - molecule_id: UUID (required)
                - prediction_type: str (required, e.g., 'absorption', 'toxicity')
                - results: dict (required, JSONB data)
                - confidence_score: float (optional)
                - model_version: str (optional)

        Returns:
            ADMETPrediction: Created prediction

        Example results JSONB:
            Absorption: {
                "bioavailability": 0.85,
                "caco2_permeability": 1.2e-5,
                "pgp_substrate": false
            }
            Toxicity: {
                "ld50": 200,
                "ames_mutagenicity": false,
                "carcinogenicity": 0.15,
                "hepatotoxicity": 0.08
            }
        """
        prediction = ADMETPrediction(**prediction_data)
        self.session.add(prediction)
        await self.session.commit()
        await self.session.refresh(prediction)
        return prediction

    async def get_by_id(self, prediction_id: uuid.UUID) -> Optional[ADMETPrediction]:
        """Get prediction by ID"""
        result = await self.session.execute(
            select(ADMETPrediction).where(ADMETPrediction.id == prediction_id)
        )
        return result.scalar_one_or_none()

    async def get_by_molecule(
        self,
        molecule_id: uuid.UUID,
        prediction_type: Optional[str] = None
    ) -> List[ADMETPrediction]:
        """
        Get all predictions for a molecule, optionally filtered by type.

        Args:
            molecule_id: UUID of the molecule
            prediction_type: Optional filter (e.g., 'absorption', 'toxicity')

        Returns:
            List of predictions ordered by creation date (newest first)
        """
        query = select(ADMETPrediction).where(
            ADMETPrediction.molecule_id == molecule_id
        )

        if prediction_type:
            query = query.where(ADMETPrediction.prediction_type == prediction_type)

        query = query.order_by(ADMETPrediction.created_at.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_latest_by_type(
        self,
        molecule_id: uuid.UUID,
        prediction_type: str
    ) -> Optional[ADMETPrediction]:
        """
        Get the most recent prediction of a specific type for a molecule.

        Args:
            molecule_id: UUID of the molecule
            prediction_type: Type of prediction (e.g., 'absorption')

        Returns:
            Latest prediction or None if not found

        Use Case: Avoid re-running predictions if recent ones exist
        """
        result = await self.session.execute(
            select(ADMETPrediction)
            .where(
                and_(
                    ADMETPrediction.molecule_id == molecule_id,
                    ADMETPrediction.prediction_type == prediction_type
                )
            )
            .order_by(ADMETPrediction.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def bulk_create(
        self,
        predictions_data: List[Dict[str, Any]]
    ) -> List[ADMETPrediction]:
        """
        Efficiently create multiple predictions in a single transaction.

        Args:
            predictions_data: List of prediction dictionaries

        Returns:
            List of created predictions

        Performance: ~10x faster than individual creates for 100+ predictions
        """
        predictions = [ADMETPrediction(**data) for data in predictions_data]
        self.session.add_all(predictions)
        await self.session.commit()

        for pred in predictions:
            await self.session.refresh(pred)

        return predictions

    async def delete(self, prediction_id: uuid.UUID) -> bool:
        """
        Delete a prediction.

        Args:
            prediction_id: UUID of the prediction

        Returns:
            bool: True if deleted, False if not found
        """
        prediction = await self.get_by_id(prediction_id)
        if prediction:
            await self.session.delete(prediction)
            await self.session.commit()
            return True
        return False

    async def get_predictions_summary(
        self,
        molecule_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Get a summary of all predictions for a molecule.

        Args:
            molecule_id: UUID of the molecule

        Returns:
            Dictionary mapping prediction types to their latest results

        Example:
            {
                "absorption": {"bioavailability": 0.85, ...},
                "distribution": {"vd": 1.5, ...},
                "toxicity": {"ld50": 200, ...}
            }
        """
        predictions = await self.get_by_molecule(molecule_id)

        # Group by type, keeping only the latest of each type
        summary = {}
        for pred in predictions:
            if pred.prediction_type not in summary:
                summary[pred.prediction_type] = {
                    "results": pred.results,
                    "confidence_score": pred.confidence_score,
                    "model_version": pred.model_version,
                    "created_at": pred.created_at
                }

        return summary
