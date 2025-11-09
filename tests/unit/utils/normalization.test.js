const {stringNormalizer} = require('../../../lib/stringNormalizer');



 // excluded fields ["username", "password", "code", "coupon_code", "group_code", "organizationSiteURL", "organizationLogo", "passwordAgain", "confirmedMail", "organizationType","qr_code_svg" ]
describe('string Normalizer with excluded fields', () => {

    it('should make user the with uppercase and without accent in strings', () => {
                    const send = {
                    "username": "gatinot3514@knilok.com",
                    "password": "gatinot3514@knilok.com",
                    "passwordAgain": "gatinot3514@knilok.com",
                    "fullname": "Γιώργος Λουμπάκης",
                    "mobile_phone": "6937708146",
                    "street": "Αϊδινίου",
                    "zipCode": "13451",
                    "streetNo": "18",
                    "birth_year": 1990,
                    "household_members": "",
                    "organization": "685d3ed3b9dd9a6f58376e83",
                    "createdAt": "2025-06-04T13:51:43.084Z",
                    "updatedAt": "2025-07-23T07:26:01.388Z",
                    "__v": 0,
                    "updatedBy": "6846a89478e2acf13d707a6b"
            }

        const final = {
                    "username": "gatinot3514@knilok.com",
                    "password": "gatinot3514@knilok.com",
                    "passwordAgain": "gatinot3514@knilok.com",
                    "fullname": "ΓΙΩΡΓΟΣ ΛΟΥΜΠΑΚΗΣ",
                    "mobile_phone": "6937708146",
                    "street": "ΑΙΔΙΝΙΟΥ",
                    "zipCode": "13451",
                    "streetNo": "18",
                    "birth_year": 1990,
                    "household_members": "",
                     "organization": "685d3ed3b9dd9a6f58376e83",
                    "createdAt": "2025-06-04T13:51:43.084Z",
                    "updatedAt": "2025-07-23T07:26:01.388Z",
                    "__v": 0,
                    "updatedBy": "6846a89478e2acf13d707a6b"
            }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });



    it('should make color the with uppercase and without accent in strings', () => {
                    const send = 
                            {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "color": "τέΣτ Έκει Θωμαΐδης",
                                "code_number": "80",
                                "type": "Πλαστικό",
                                "organization": "685d3ed3b9dd9a6f58376e83",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }
                  
            const final = 
                  {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "color": "ΤΕΣΤ ΕΚΕΙ ΘΩΜΑΙΔΗΣ",
                                "code_number": "80",
                                "type": "ΠΛΑΣΤΙΚΟ",
                                "organization": "685d3ed3b9dd9a6f58376e83",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });


   it('should not change anything in weight', () => {
                    const send = {
                                                "qr_code": "Β123700MDMV5TKI",
                                                "weight": 45.6,
                                                 "organization": "685d3ed3b9dd9a6f58376e83",
                                                "createdAt": "2025-06-04T13:51:43.084Z",
                                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                                "__v": 0,
                                                "updatedBy": "6846a89478e2acf13d707a6b"
                                            }
        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(send);
    });
    
      
    
    it('should make organization the with uppercase and without accent in strings', () => {
                    const send = 
                            {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "organizationName": "Δήμος Πειραιά 2",
                                "colors": [
                                  "68404f898acb2cc969bf00f9",
                                 "68404fa58acb2cc969bf00fd"
                                ],
                                "organizationType": "municipality",
                                "organizationCode": "ΔΠ32",
                                "organization": "685d3ed3b9dd9a6f58376e83",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }
                  
            const final = 
                {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "organizationName": "ΔΗΜΟΣ ΠΕΙΡΑΙΑ 2",
                                "colors": [
                                  "68404f898acb2cc969bf00f9",
                                 "68404fa58acb2cc969bf00fd"
                                ],
                                "organizationType": "municipality",
                                "organizationCode": "ΔΠ32",
                                "organization": "685d3ed3b9dd9a6f58376e83",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });

        it('should make collection point the with uppercase and without accent in strings', () => {
                    const send = 
                            {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "title": "Γυροκομέιο",
                                "devices": ["685d40b5b9dd9a6f58376eb0"],
                                "organization": "686629254287339404f11aa9",
                                "address" : "68662c064287339404f11d69",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }
                  
            const final = 
                {
                                "_id": "68404f6f8acb2cc969bf00f7",
                                "title": "ΓΥΡΟΚΟΜΕΙΟ",
                                "devices": ["685d40b5b9dd9a6f58376eb0"],
                                "organization": "686629254287339404f11aa9",
                                "address" : "68662c064287339404f11d69",
                                "createdAt": "2025-06-04T13:51:43.084Z",
                                "updatedAt": "2025-07-23T07:26:01.388Z",
                                "__v": 0,
                                "updatedBy": "6846a89478e2acf13d707a6b"
                    }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
         it('should make coupon the with uppercase and without accent in strings', () => {
                    const send = 
                          {
                                        "name": "Δωροεπιταγή 50€",
                                        "offer_type": "68da3ec2a504c4131f54c409",
                                        "discount_percentage": 30,
                                        "gift_offer": "",
                                        "coupon_value": null,
                                        "points_value": null,
                                        "min_purchase": null,
                                        "pay_x": null,
                                        "get_x": null,
                                        "unit_price": 1,
                                        "start_date":  "2024-01-02T00:00:00.000Z",
                                        "end_date":   "2025-12-30T00:00:00.000Z",
                                        "partner":  "6853d7fe2ed0ca8adcf1608a",
                                        "isActive": true,
                                        "details": null,
                                        "terms_conditions": "Με την αγορά προϊόντων 500€ δώρο μια δωροεπιταγή 50€",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }
            const final = 
                  {
                                        "name": "ΔΩΡΟΕΠΙΤΑΓΗ 50€",
                                        "offer_type": "68da3ec2a504c4131f54c409",
                                        "discount_percentage": 30,
                                        "gift_offer": "",
                                        "coupon_value": null,
                                        "points_value": null,
                                        "min_purchase": null,
                                        "pay_x": null,
                                        "get_x": null,
                                        "unit_price": 1,
                                        "start_date":  "2024-01-02T00:00:00.000Z",
                                        "end_date":   "2025-12-30T00:00:00.000Z",
                                        "partner":  "6853d7fe2ed0ca8adcf1608a",
                                        "isActive": true,
                                        "details": null,
                                        "terms_conditions": "ΜΕ ΤΗΝ ΑΓΟΡΑ ΠΡΟΙΟΝΤΩΝ 500€ ΔΩΡΟ ΜΙΑ ΔΩΡΟΕΠΙΤΑΓΗ 50€",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
     it('should make a role  the with uppercase and without accent in strings', () => {
                    const send = 
                       {
                                "role": "Test User",
                                "permissions": [
                                  {
                                    "entity": "TU",
                                    "allowed": [
                                      0,
                                      1,
                                      2,
                                      3,
                                      4,
                                      5,
                                      6,
                                      7,
                                      8,
                                      9
                                    ],
                                    "denied": [  10,
                                      11,
                                      12,
                                      13,
                                      14,
                                      15]
                                  }
                                ],
                                "organization":  "682c71587010179fd2277026"
                        }
                  
            const final = 
                  {
                                "role": "TEST USER",
                                "permissions": [
                                  {
                                    "entity": "TU",
                                    "allowed": [
                                      0,
                                      1,
                                      2,
                                      3,
                                      4,
                                      5,
                                      6,
                                      7,
                                      8,
                                      9
                                    ],
                                    "denied": [  10,
                                      11,
                                      12,
                                      13,
                                      14,
                                      15]
                                  }
                                ],
                                "organization":  "682c71587010179fd2277026"
                        }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
             it('should stay the same in couponclaims', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                        "user": "6846a89478e2acf13d707a6b",
                                        "coupon":"6863a075a06f8145e2cf47b2",
                                        "group_code": "Loyal Jun2025",
                                        "coupon_code": "mckabhza",
                                        "qr_code_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 29 29\" shape-rendering=\"crispEdges\"><path fill=\"#ffffff\" d=\"M0 0h29v29H0z\"/><path stroke=\"#000000\" d=\"M4 4.5h7m1 0h3m1 0h1m1 0h7M4 5.5h1m5 0h1m2 0h2m3 0h1m5 0h1M4 6.5h1m1 0h3m1 0h1m3 0h3m1 0h1m1 0h3m1 0h1M4 7.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h1m1 0h3m1 0h1M4 8.5h1m1 0h3m1 0h1m1 0h2m1 0h2m1 0h1m1 0h3m1 0h1M4 9.5h1m5 0h1m1 0h1m1 0h1m1 0h1m1 0h1m5 0h1M4 10.5h7m1 0h1m1 0h1m1 0h1m1 0h7M12 11.5h1m1 0h1M4 12.5h1m3 0h1m1 0h5m1 0h6m2 0h1M4 13.5h5m2 0h2m3 0h3m1 0h1m1 0h2M4 14.5h1m1 0h2m1 0h5m2 0h2m2 0h1m1 0h2M4 15.5h2m2 0h1m5 0h3m2 0h1m3 0h1M4 16.5h1m2 0h5m2 0h2m1 0h2m1 0h1M12 17.5h1m1 0h3m2 0h2m2 0h1M4 18.5h7m1 0h1m2 0h1m2 0h1m1 0h1m1 0h2M4 19.5h1m5 0h1m2 0h1m3 0h4M4 20.5h1m1 0h3m1 0h1m1 0h3m1 0h3m1 0h1m2 0h1M4 21.5h1m1 0h3m1 0h1m2 0h1m2 0h3m1 0h1m1 0h3M4 22.5h1m1 0h3m1 0h1m2 0h1m2 0h2m2 0h1M4 23.5h1m5 0h1m3 0h3m2 0h1M4 24.5h7m1 0h4m2 0h1m5 0h1\"/></svg>\n",
                                        "redeemed": true,
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }

        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(send);
    });
    it('should make a device the with uppercase and without accent in strings', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                        "deviceId": "6846a89478e2acf13d707a6b",
                                        "title":"Κάδος τέστ",
                                        "type": "BIN",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }
                    const final = 
                            {
                            "_id":  "6863a0a6a06f8145e2cf47b9",
                            "deviceId": "6846a89478e2acf13d707a6b",
                            "title":"ΚΑΔΟΣ ΤΕΣΤ",
                            "type": "BIN",
                            "createdBy": "6846a89478e2acf13d707a6b",
                            "organization":"6840478e5f6181f5683c61eb",
                            "createdAt": "2025-07-01T08:46:45.715Z",
                            "updatedAt": "2025-07-01T08:46:45.715Z",
                            "__v": 0
                          }


        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
        it('should make a device type the with uppercase and without accent in strings', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                        "type": "Ηλεκτρονικός Κάδος",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }
                    const final = 
                            {
                            "_id":  "6863a0a6a06f8145e2cf47b9",
                            "type": "ΗΛΕΚΤΡΟΝΙΚΟΣ ΚΑΔΟΣ",
                            "createdBy": "6846a89478e2acf13d707a6b",
                            "organization":"6840478e5f6181f5683c61eb",
                            "createdAt": "2025-07-01T08:46:45.715Z",
                            "updatedAt": "2025-07-01T08:46:45.715Z",
                            "__v": 0
                          }


        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
          it('should make a partner type the with uppercase and without accent in strings', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                        "type": "Ηλεκτρονικός Κάδος",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }
                    const final = 
                            {
                            "_id":  "6863a0a6a06f8145e2cf47b9",
                            "type": "ΗΛΕΚΤΡΟΝΙΚΟΣ ΚΑΔΟΣ",
                            "createdBy": "6846a89478e2acf13d707a6b",
                            "organization":"6840478e5f6181f5683c61eb",
                            "createdAt": "2025-07-01T08:46:45.715Z",
                            "updatedAt": "2025-07-01T08:46:45.715Z",
                            "__v": 0
                          }


        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
    it('should stay the same in old bagcode', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                        "code": "Q43282963778bC",
                                        "color": "68404f6f8acb2cc969bf00f7",
                                        "prefix": "432", "number": 2,
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }


        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(send);
    });
    
        it('should make a partner  the with uppercase and without accent in strings', () => {
                    const send = 
                                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                         "organizationName": " συνεργάτης τεστ ",
                                        "location": [37.9838, 23.7275],
                                        "organizationVat": "123456789",
                                        "organizationTaxOffice": "Αθήνα",
                                        "organizationCategory": "Τεχνολογία",
                                        "organizationContact": "Γιάννης Παπαδόπουλος",
                                        "organizationStreet": "Τέστ",
                                        "organizationStreetNo": "123A",
                                        "organizationMunicipality": "Αθήνα",
                                        "organizationZipCode": "10434",
                                        "organizationLogo": "greentech-logo.png",
                                        "organizationSiteURL": "https://www.test.gr",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }
                    const final = 
                        {
                                        "_id":  "6863a0a6a06f8145e2cf47b9",
                                         "organizationName": " ΣΥΝΕΡΓΑΤΗΣ ΤΕΣΤ ",
                                        "location": [37.9838, 23.7275],
                                        "organizationVat": "123456789",
                                        "organizationTaxOffice": "ΑΘΗΝΑ",
                                        "organizationCategory": "ΤΕΧΝΟΛΟΓΙΑ",
                                        "organizationContact": "ΓΙΑΝΝΗΣ ΠΑΠΑΔΟΠΟΥΛΟΣ",
                                        "organizationStreet": "ΤΕΣΤ",
                                        "organizationStreetNo": "123A",
                                        "organizationMunicipality": "ΑΘΗΝΑ",
                                        "organizationZipCode": "10434",
                                        "organizationLogo": "greentech-logo.png",
                                        "organizationSiteURL": "https://www.test.gr",
                                        "createdBy": "6846a89478e2acf13d707a6b",
                                        "organization":"6840478e5f6181f5683c61eb",
                                        "createdAt": "2025-07-01T08:46:45.715Z",
                                        "updatedAt": "2025-07-01T08:46:45.715Z",
                                        "__v": 0
                                      }


        const afterNormalization = stringNormalizer(send);
        expect(afterNormalization).toEqual(final);
    });
    });