const {collectionPointValidate} = require('../../models/schemas/collectionPoints');

const getValidData = () => {
    return {
        title: 'Test Point',
        addresses: {
            _id: '507f1f77bcf86cd799439011',
            address: 'Οδ. Ελύτη 13',
            latitude: 40.7128,
            longitude: -74.0060
        },
        devices: [{
                _id: '507f1f77bcf86cd799439011',
                title: 'test',
                type: 'test'

            }]
    };
};



describe('Validation for Collection Points Schema', () => {

    describe('Validation for addresses subschema', () => {

        it('should fail for missing street address', () => {
            const data = getValidData();
            delete data.addresses.address;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing empty address', () => {
            const data = getValidData();
            data.addresses.address = '';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for invalid address _id', () => {
            const data = getValidData();
            data.addresses._id = 'a';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing address _id', () => {
            const data = getValidData();
            delete data.addresses._id;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing addresses', () => {
            const data = getValidData();
            delete data.addresses;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for no numeric latitude', () => {
            const data = getValidData();
            data.latitude = '';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for empty latitude', () => {
            const data = getValidData();
            delete data.latitude;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for no numeric longitude', () => {
            const data = getValidData();
            data.longitude = '';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for empty longitude', () => {
            const data = getValidData();
            delete data.latitude;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

    });

    describe('Validation for devices subschema', () => {

        it('should fail for empty devices', () => {
            const data = getValidData();
            delete data.devices;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for invalid address _id', () => {
            const data = getValidData();
            data.devices[0]._id = 'a';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing devices _id', () => {
            const data = getValidData();
            delete data.devices[0]._id;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for empty devices', () => {
            const data = getValidData();
            data.devices = [];
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for empty device title', () => {
            const data = getValidData();
            data.devices[0].title = '';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing device title', () => {
            const data = getValidData();
            delete data.devices[0].title;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for empty type', () => {
            const data = getValidData();
            data.devices[0].type = '';
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

        it('should fail for missing type', () => {
            const data = getValidData();
            delete data.devices[0].type;
            try {
                collectionPointValidate(data);
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeTruthy();
            }
        });

    });

    it('should fail for empty address title', () => {
        const data = getValidData();
        data.title = '';
        try {
            collectionPointValidate(data);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeTruthy();
        }
    });

    it('should fail for missing address title', () => {
        const data = getValidData();
        delete data.title;
        try {
            collectionPointValidate(data);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeTruthy();
        }
    });

    it('should validate for correct data', () => {
        const data = getValidData();
        try {
            const result = collectionPointValidate(data);
            expect(result).toBeTruthy();
        } catch (error) {
            console.log(JSON.stringify(error));
            expect(true).toBe(false);
        }

    });



});