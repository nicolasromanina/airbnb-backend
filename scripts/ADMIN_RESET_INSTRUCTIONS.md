#!/bin/bash

# MongoDB Atlas manual admin reset guide
# Execute this in MongoDB Atlas web console or via mongosh

# Step 1: Connect to your MongoDB Atlas cluster
# Use the connection string: mongodb+srv://airbnb_user:d4CdJV6T8E8EIJvR@airrbnb-cluster.upznduc.mongodb.net/?appName=airrbnb-cluster

# Step 2: Select the database
# use test

# Step 3: Delete old admin
# db.users.deleteOne({ email: "admin@airbnb.com" })

# OR update the password field directly (unsafe, but possible):
# For MongoDB shell, use this to generate a bcrypt hash:
# require('bcryptjs').hashSync('AdminPass123!', 10)

# Then update:
# db.users.updateOne(
#   { email: "admin@airbnb.com" },
#   {
#     $set: {
#       password: "<bcrypt-hash-here>",
#       isActive: true,
#       role: "superadmin"
#     }
#   }
# )

echo "🔧 Admin Reset Instructions:"
echo ""
echo "1. Go to MongoDB Atlas: https://cloud.mongodb.com"
echo "2. Select your cluster: airrbnb-cluster"
echo "3. Click 'Browse Collections'"
echo "4. Select database: test"
echo "5. Select collection: users"
echo "6. Delete the admin@airbnb.com document:"
echo ""
echo "   db.users.deleteOne({ email: \"admin@airbnb.com\" })"
echo ""
echo "7. Then redeploy the backend on Render"
echo "8. A new admin will be automatically created with:"
echo "   Email: admin@airbnb.com"
echo "   Password: AdminPass123!"
