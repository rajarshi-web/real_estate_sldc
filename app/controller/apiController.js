const Property = require('../model/propertyModel');

class PropertyController {
    // CREATE
    async createProperty(req, res) {
        try {
            const { title, description, price, address, city, state, country, type, images } = req.body;

            // 1. Basic Validation (Matching your schema's 'required' fields)
            if (!title || !price || !city || !type) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide title, price, city, and propertyType (type)"
                });
            }

            const propertyData = new Property({
                title,
                description,
                price,
                // Mapping nested location object
                location: {
                    address,
                    city,
                    state,
                    country
                },

                propertyType: type.toLowerCase(),
                images: images || [],

                //reatedBy: req.user ? req.user._id : null
            });

            // 3. Save to Database
            const savedProperty = await propertyData.save();

            return res.status(201).json({
                success: true,
                message: "Property listing created successfully",
                data: savedProperty
            });

        } catch (error) {
            console.error('Create Error:', error.message);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // READ (All with filters)
    async getProperties(req, res) {
        try {
            // 1. Destructure query parameters
            const { city, type, minPrice, maxPrice, bhk } = req.query;
            let query = {};

            if (city) {
                query['location.city'] = { $regex: city, $options: 'i' };
            }
            if (type) {
                query.propertyType = type.toLowerCase();
            }

            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = Number(minPrice);
                if (maxPrice) query.price.$lte = Number(maxPrice);
            }

            const properties = await Property.find(query).populate('createdBy', 'name email');

            res.status(200).json({
                success: true,
                count: properties.length,
                data: properties
            });
        } catch (error) {

            console.error("GET ALL ERROR:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // READ (Single)
    async getPropertyById(req, res) {
        try {
            // Change 'owner' to 'createdBy' to match your schema
            const property = await Property.findById(req.params.id).populate('createdBy', 'name email phone');

            if (!property) {
                return res.status(404).json({ success: false, message: "Property not found" });
            }

            res.status(200).json({ success: true, data: property });
        } catch (error) {
            // This catch block handles cases where the ID string is not a valid 24-character hex string
            res.status(400).json({ success: false, message: "Invalid ID format" });
        }
    }
    // UPDATE
    async updateProperty(req, res) {
        try {
            // 1. Find property
            let property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ success: false, message: "Not found" });

            // 2. SAFE CHECK: Use optional chaining (?.)
            // This prevents the "Cannot read properties of undefined (reading 'toString')" error
            const ownerId = property.createdBy?.toString();
            const userId = req.user?._id?.toString();

            if (ownerId !== userId) {
                return res.status(401).json({
                    success: false,
                    message: "Not authorized to update this property"
                });
            }

            // 3. Update logic
            const updatedProperty = await Property.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true, runValidators: true }
            );

            res.status(200).json({ success: true, data: updatedProperty });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // DELETE
    async deleteProperty(req, res) {
        try {
            const property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ success: false, message: "Not found" });

            // SAFE CHECK: If createdBy is missing in DB, we prevent the crash
            if (property.createdBy?.toString() !== req.user?._id?.toString()) {
                return res.status(401).json({ success: false, message: "Not authorized to delete" });
            }

            await Property.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: "Property deleted successfully" });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PropertyController();