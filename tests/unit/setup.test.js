
const {db} = global.__TEST_MONGO;

describe('Test global setup', () => {

    
    it ('should return the Admin user', async () => {

        const user = await db.collection('users').findOne();
        expect(user.fullname).toBe('Admin');
        expect(user._id.toString()).toBe("68662b3e4287339404f11c17");
        expect(user.organization.toString()).toBe("685517e093b7c7533a61b2f4");
        expect(user._id).toEqual(user.createdBy);
        expect(user._id).toEqual(user.updatedBy);       
        expect(user).toHaveProperty('createdAt');
        expect(user.createdAt).not.toBeNull();
        expect(user.createdAt).not.toBeUndefined();
        expect(user.createdAt).not.toBe("");
        expect(user.createdAt).toEqual(user.updatedAt);
    });

    it ('should return 6 partner types', async () => {
        const partnerTypes = await db.collection('partnertypes').find().toArray();
        expect(partnerTypes.length).toBe(6);
    });

    it ('should return 4 colors', async () => {
       const colors = await db.collection('colors').find().toArray();
       console.log(colors);
       expect(colors.length).toBe(4);        
    });
    
    it ('should have 68404f6f8acb2cc969bf00f7 id with KOKKKINO color and ΠΛΑΣΤΙΚΟ', async() => {
                                                                                      
        const color = await db.collection('colors').findOne({_id: new ObjectId("68404f6f8acb2cc969bf00f7")});
        expect(color).not.toBeNull();
        expect(color.color).toBe("ΚΟΚΚΙΝΟ");
        expect(color.type).toBe("ΠΛΑΣΤΙΚΟ");
    });
    
    
    it ('should have 68404f898acb2cc969bf00f9 id with KΙΤΡΙΝΙΟ color and ΧΑΡΤΙ', async() => {
                                                                                      
        const color = await db.collection('colors').findOne({_id: new ObjectId("68404f898acb2cc969bf00f9")});
        expect(color).not.toBeNull();
        expect(color.color).toBe("ΚΙΤΡΙΝΟ");
        expect(color.type).toBe("ΧΑΡΤΙ");
    });
    
    it ('should have 68404f918acb2cc969bf00fb id with KΑΦΕ color and ΟΡΓΑΝΙΚΟ', async() => {
                                                                                      
        const color = await db.collection('colors').findOne({_id: new ObjectId("68404f918acb2cc969bf00fb")});
        expect(color).not.toBeNull();
        expect(color.color).toBe("ΚΑΦΕ");
        expect(color.type).toBe("ΟΡΓΑΝΙΚΟ");
    });
    
    it ('should have 68404fa58acb2cc969bf00fd id with ΜΠΛΕ color and PMD', async() => {
                                                                                      
        const color = await db.collection('colors').findOne({_id: new ObjectId("68404fa58acb2cc969bf00fd")});
        expect(color).not.toBeNull();
        expect(color.color).toBe("ΜΠΛΕ");
        expect(color.type).toBe("PMD");
    });
    
    
    it ('should return 3 organizations', async () => {
       const organizations = await db.collection('organizations').find().toArray();
       expect(organizations.length).toBe(3);
    });
    
    it ('should return the MainSys organization', async () => {

        const org = await db.collection('organizations').findOne();
        expect(org.organizationName).toBe("MainSys");
        expect(org._id.toString()).toBe("685517e093b7c7533a61b2f4");
        expect(org.organizationVat).toBe("999239906");
        expect(org.organizationGecr).toBe("006609101000");
        expect(org.createdBy.toString()).toEqual("68662b3e4287339404f11c17");
        expect(org.updatedBy.toString()).toEqual("68662b3e4287339404f11c17");
        expect(org.organization).toBeNull();
        expect(org.partnerType.toString()).toEqual('6891c41ad6dc27eee58caa1e');
        expect(org).toHaveProperty('createdAt');
        expect(org.createdAt).not.toBeNull();
        expect(org.createdAt).not.toBeUndefined();
        expect(org.createdAt).not.toBe("");
        expect(org.createdAt).toEqual(org.updatedAt);
    });
    
});
