/**
 * Feldrix — "Add breeding details" prompt for a pregnant animal.
 *
 * Shown when a female is marked Pregnant on Livestock (or listed on the
 * Breeding page without a breeding record). Wraps the standard BreedingForm
 * with the female pre-selected and status "Pregnant". The sire is optional,
 * so AI / outside bulls work. "Skip for now" closes without saving.
 */
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import BreedingForm from "./BreedingForm";

export default function PregnancyBreedingPrompt({ animal, open, onClose, onSaved }) {
  if (!open || !animal) return null;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Add breeding details for {animal.tag}
        <Typography variant="body2" color="text.secondary">
          {animal.tag} is marked Pregnant. Record the breeding so it shows on the Breeding page with an expected birth date.
          The sire is optional for AI or an outside bull.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <BreedingForm
          animalId={animal.id}
          defaultStatus="Pregnant"
          refreshRecords={async () => {}}
          onSaved={onSaved}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Skip for now</Button>
      </DialogActions>
    </Dialog>
  );
}
