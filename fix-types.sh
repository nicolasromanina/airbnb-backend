#!/bin/bash
# Fix TypeScript req.user errors

cd "e:\Airbnb\okk\hero-showcase\backend"

# Use sed to replace all instances
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/apartmentDetailController.ts
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/contactController.ts
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/apartmentController.ts
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/homeController.ts
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/roomDetailController.ts
sed -i 's/const updatedBy = req\.user\?\.email/const updatedBy = (req as any).user?.email/g' src/controllers/serviceController.ts

echo "All files fixed!"
