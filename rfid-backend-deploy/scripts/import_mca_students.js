import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const students = [
  {
    "name": "Roshan",
    "rfidUid": "9869497",
    "enrollmentNo": "00117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "REYAANSH DHAMMI",
    "rfidUid": "9866858",
    "enrollmentNo": "00217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Abhijeet Singh",
    "rfidUid": "9865463",
    "enrollmentNo": "00317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "UJJWAL SINGH",
    "rfidUid": "10029483",
    "enrollmentNo": "00417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Paras",
    "rfidUid": "10265221",
    "enrollmentNo": "00517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Muskan Saluja",
    "rfidUid": "10250852",
    "enrollmentNo": "00617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vivek mittal",
    "rfidUid": "10265392",
    "enrollmentNo": "00717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Manjyot kaur",
    "rfidUid": "9843520",
    "enrollmentNo": "00917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Arjun Sharma",
    "rfidUid": "9842359",
    "enrollmentNo": "01017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsh Sharma",
    "rfidUid": "9939071",
    "enrollmentNo": "01217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Silky",
    "rfidUid": "9940896",
    "enrollmentNo": "01317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsimar Kaur",
    "rfidUid": "9882621",
    "enrollmentNo": "01417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Kuljot Singh",
    "rfidUid": "9858251",
    "enrollmentNo": "01517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sarthak Arora",
    "rfidUid": "10315921",
    "enrollmentNo": "01617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pratham Singh",
    "rfidUid": "10340642",
    "enrollmentNo": "01717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vagish Gupta",
    "rfidUid": "9858252",
    "enrollmentNo": "01817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Prateek Sharma",
    "rfidUid": "10309883",
    "enrollmentNo": "01917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ankit Ahlawat",
    "rfidUid": "10302038",
    "enrollmentNo": "02017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aastha shukla",
    "rfidUid": "10337068",
    "enrollmentNo": "02117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Abhay Pratap singh",
    "rfidUid": "9893819",
    "enrollmentNo": "02217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Agampreet singh",
    "rfidUid": "9895205",
    "enrollmentNo": "02317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Darsh Aggarwal",
    "rfidUid": "10327658",
    "enrollmentNo": "02417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Deepak Mandal",
    "rfidUid": "10015213",
    "enrollmentNo": "02517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Renu Negi",
    "rfidUid": "10291271",
    "enrollmentNo": "02617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Prabhpreet singh",
    "rfidUid": "10313758",
    "enrollmentNo": "02717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ritik Tanwar",
    "rfidUid": "10329028",
    "enrollmentNo": "02817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sumit Yadav",
    "rfidUid": "10341614",
    "enrollmentNo": "02917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sai Abhinav",
    "rfidUid": "10340719",
    "enrollmentNo": "03017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Naman Choudhary",
    "rfidUid": "9868257",
    "enrollmentNo": "03117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aryan Bhambri",
    "rfidUid": "9866857",
    "enrollmentNo": "03217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Anirudh Chaurasia",
    "rfidUid": "9865310",
    "enrollmentNo": "03317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Charul Yadav",
    "rfidUid": "10029487",
    "enrollmentNo": "03417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aryan Gupta",
    "rfidUid": "10334665",
    "enrollmentNo": "03517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "PIYUSH KAUSHIK",
    "rfidUid": "10314824",
    "enrollmentNo": "03617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nandini",
    "rfidUid": "10298365",
    "enrollmentNo": "03717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sanya Verma",
    "rfidUid": "9971142",
    "enrollmentNo": "03817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsha Priya",
    "rfidUid": "9847003",
    "enrollmentNo": "03917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shubham Nainwal",
    "rfidUid": "9848282",
    "enrollmentNo": "04017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harshit joshi",
    "rfidUid": "9849524",
    "enrollmentNo": "04117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Divyam Gupta",
    "rfidUid": "9949086",
    "enrollmentNo": "04217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Deepanshu saxena",
    "rfidUid": "9947915",
    "enrollmentNo": "04317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Dhruv Arora",
    "rfidUid": "9865674",
    "enrollmentNo": "04417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Jatin Gola",
    "rfidUid": "9879150",
    "enrollmentNo": "04517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nimish Mehta",
    "rfidUid": "9880562",
    "enrollmentNo": "04617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Tushar Arora",
    "rfidUid": "9882620",
    "enrollmentNo": "04717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pradeep Bisht",
    "rfidUid": "10308487",
    "enrollmentNo": "04817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shekhar Chhabra",
    "rfidUid": "10341879",
    "enrollmentNo": "04917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Prabhneet Singh Sethi",
    "rfidUid": "9893820",
    "enrollmentNo": "05017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aakanksh Chandra",
    "rfidUid": "9896004",
    "enrollmentNo": "05117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Jhanvi Khanna",
    "rfidUid": "10284006",
    "enrollmentNo": "05217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vishal Raj",
    "rfidUid": "10301080",
    "enrollmentNo": "05317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vibhor Kohli",
    "rfidUid": "10321640",
    "enrollmentNo": "05417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nikita mongia",
    "rfidUid": "10305129",
    "enrollmentNo": "05517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Oshin Mehta",
    "rfidUid": "10323947",
    "enrollmentNo": "05617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Prathu Garg",
    "rfidUid": "10015212",
    "enrollmentNo": "05717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Srishti Arora",
    "rfidUid": "8090474",
    "enrollmentNo": "05817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aayush Chopra",
    "rfidUid": "8123405",
    "enrollmentNo": "05917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsh sharma",
    "rfidUid": "8100533",
    "enrollmentNo": "06017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Abhishek Choudhary",
    "rfidUid": "8310359",
    "enrollmentNo": "06117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ronit Gupta",
    "rfidUid": "8117056",
    "enrollmentNo": "06217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aarushi",
    "rfidUid": "8069622",
    "enrollmentNo": "06317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Kashish Aggarwal",
    "rfidUid": "8125219",
    "enrollmentNo": "06417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Malya Kapoor",
    "rfidUid": "8166758",
    "enrollmentNo": "06517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Madhur Dhawan",
    "rfidUid": "8081962",
    "enrollmentNo": "06617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ansh  Mongia",
    "rfidUid": "8134151",
    "enrollmentNo": "06717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Mahima Nagpal",
    "rfidUid": "8367748",
    "enrollmentNo": "06817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Hriday Bhatia",
    "rfidUid": "8275753",
    "enrollmentNo": "06917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aditya Thapa",
    "rfidUid": "8366076",
    "enrollmentNo": "07017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vidhi gupta",
    "rfidUid": "8298045",
    "enrollmentNo": "07117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Hardik Sharma",
    "rfidUid": "8335972",
    "enrollmentNo": "07217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsh Mathur",
    "rfidUid": "8163579",
    "enrollmentNo": "08517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "RAJNIKANT UPADHYAY",
    "rfidUid": "8090530",
    "enrollmentNo": "07317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ayush Verma",
    "rfidUid": "8317321",
    "enrollmentNo": "07417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aryan sharma",
    "rfidUid": "8271754",
    "enrollmentNo": "07517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aanchal",
    "rfidUid": "8286072",
    "enrollmentNo": "07617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Yash Bhartari",
    "rfidUid": "8348179",
    "enrollmentNo": "07717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shruti jain",
    "rfidUid": "8098882",
    "enrollmentNo": "07917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vanshika Tanwar",
    "rfidUid": "8103041",
    "enrollmentNo": "08017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Tanishka Gupta",
    "rfidUid": "8326624",
    "enrollmentNo": "08117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vaibhav Sharma",
    "rfidUid": "8070650",
    "enrollmentNo": "08217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sumit saggar",
    "rfidUid": "8083371",
    "enrollmentNo": "08317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shivam jain",
    "rfidUid": "8088833",
    "enrollmentNo": "08417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Mayank Kandpal",
    "rfidUid": "8120323",
    "enrollmentNo": "08617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Yatharth Yadav",
    "rfidUid": "8112659",
    "enrollmentNo": "08717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Kartik",
    "rfidUid": "8075958",
    "enrollmentNo": "08817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Roopina Girotra",
    "rfidUid": "8094741",
    "enrollmentNo": "08917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nayan Jaiswal",
    "rfidUid": "8131151",
    "enrollmentNo": "09017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Deepesh Chauhan",
    "rfidUid": "8164412",
    "enrollmentNo": "09117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Jamir uddin khan",
    "rfidUid": "8113800",
    "enrollmentNo": "09217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Rhythm aggarwal",
    "rfidUid": "8130661",
    "enrollmentNo": "09317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Yash Jha",
    "rfidUid": "8291110",
    "enrollmentNo": "09417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shivam Sarwan",
    "rfidUid": "8327881",
    "enrollmentNo": "09517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Suneet kalsi",
    "rfidUid": "8315858",
    "enrollmentNo": "09617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harshit Gupta",
    "rfidUid": "8364809",
    "enrollmentNo": "09717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Rachit vats",
    "rfidUid": "8322433",
    "enrollmentNo": "09817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Dhruv Verma",
    "rfidUid": "8334898",
    "enrollmentNo": "09917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ishika Gupta",
    "rfidUid": "8326826",
    "enrollmentNo": "10017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "prashant chaubey",
    "rfidUid": "8306042",
    "enrollmentNo": "10117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pranav Verma",
    "rfidUid": "8279929",
    "enrollmentNo": "10217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Joy Madan",
    "rfidUid": "8325346",
    "enrollmentNo": "10317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Diya Arora",
    "rfidUid": "8330384",
    "enrollmentNo": "10517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Soumil Verma",
    "rfidUid": "8375231",
    "enrollmentNo": "10717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sanjana Milind",
    "rfidUid": "8274542",
    "enrollmentNo": "10817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sneha Jha",
    "rfidUid": "8358599",
    "enrollmentNo": "10917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Jashn sharma",
    "rfidUid": "8331919",
    "enrollmentNo": "11017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sarthak Singhal",
    "rfidUid": "8341936",
    "enrollmentNo": "11117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Harsh Singh",
    "rfidUid": "8352915",
    "enrollmentNo": "11217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Khwaish jindal",
    "rfidUid": "8320236",
    "enrollmentNo": "11317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pallavi Chauhan",
    "rfidUid": "8295441",
    "enrollmentNo": "11417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Karan Yadav",
    "rfidUid": "8287721",
    "enrollmentNo": "11517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shreya Sinha",
    "rfidUid": "8358997",
    "enrollmentNo": "11717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Garima dimri",
    "rfidUid": "5678939",
    "enrollmentNo": "11817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aman Bhatnagar",
    "rfidUid": "5698891",
    "enrollmentNo": "11917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Priyanshu Negi",
    "rfidUid": "8274652",
    "enrollmentNo": "12017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "AMAN SHARMA",
    "rfidUid": "8343895",
    "enrollmentNo": "12217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sehaj",
    "rfidUid": "8283369",
    "enrollmentNo": "12317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "BHARAT SHIVMAM POPLI",
    "rfidUid": "8311095",
    "enrollmentNo": "12517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Saksham Thakur",
    "rfidUid": "8366839",
    "enrollmentNo": "12617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Gaurav Ahlawat",
    "rfidUid": "8276755",
    "enrollmentNo": "12717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shivam",
    "rfidUid": "8096372",
    "enrollmentNo": "12917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nimesh Aggarwal",
    "rfidUid": "8143010",
    "enrollmentNo": "13017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ayush Raturi",
    "rfidUid": "8109178",
    "enrollmentNo": "13117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aaditya Chugh",
    "rfidUid": "8137091",
    "enrollmentNo": "13217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Justin Jacob",
    "rfidUid": "8090558",
    "enrollmentNo": "13317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "RAKESH KUMAR BEHERA",
    "rfidUid": "8118311",
    "enrollmentNo": "13417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Khushi Aggarwal",
    "rfidUid": "8086131",
    "enrollmentNo": "13517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "lakshit suri",
    "rfidUid": "8110786",
    "enrollmentNo": "13617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aryan Mittal",
    "rfidUid": "8136202",
    "enrollmentNo": "13717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ritika Thakur",
    "rfidUid": "8373232",
    "enrollmentNo": "13817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Sahil",
    "rfidUid": "8361256",
    "enrollmentNo": "13917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pratham Madaan",
    "rfidUid": "8292345",
    "enrollmentNo": "14017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shejal gupta",
    "rfidUid": "8346254",
    "enrollmentNo": "14117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Saksham",
    "rfidUid": "8313258",
    "enrollmentNo": "14217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Garima Sharma",
    "rfidUid": "8162153",
    "enrollmentNo": "14317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shivam",
    "rfidUid": "8315425",
    "enrollmentNo": "14417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Siddharth Guleria",
    "rfidUid": "8083971",
    "enrollmentNo": "14517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Naman Bhardwaj",
    "rfidUid": "8126299",
    "enrollmentNo": "14617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Bharti Devi",
    "rfidUid": "8117585",
    "enrollmentNo": "14717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ankit soni",
    "rfidUid": "8152992",
    "enrollmentNo": "14817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "KUNAL CHAUHAN",
    "rfidUid": "8287964",
    "enrollmentNo": "14917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aryan",
    "rfidUid": "8358518",
    "enrollmentNo": "15017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Tanvi Sharma",
    "rfidUid": "8296067",
    "enrollmentNo": "15117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ritik Bansal",
    "rfidUid": "8372935",
    "enrollmentNo": "15217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ishaan Gulati",
    "rfidUid": "8351154",
    "enrollmentNo": "15317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Abhishek Maurya",
    "rfidUid": "8365664",
    "enrollmentNo": "15417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Pranjay gupta",
    "rfidUid": "8314392",
    "enrollmentNo": "15517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Anoushka verma",
    "rfidUid": "8351197",
    "enrollmentNo": "15617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Aditi sharma",
    "rfidUid": "8295937",
    "enrollmentNo": "15717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Prerna Sharma",
    "rfidUid": "8335973",
    "enrollmentNo": "15817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Himanshu",
    "rfidUid": "8321223",
    "enrollmentNo": "15917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ekansh verma",
    "rfidUid": "8166902",
    "enrollmentNo": "16017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Drishti jain",
    "rfidUid": "8127811",
    "enrollmentNo": "16117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vansh Sethi",
    "rfidUid": "8345414",
    "enrollmentNo": "16217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Chiraag sharma",
    "rfidUid": "8105203",
    "enrollmentNo": "16317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ashad Hussain",
    "rfidUid": "8137514",
    "enrollmentNo": "16417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Kshitiz Goel",
    "rfidUid": "8164109",
    "enrollmentNo": "16517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Tarini Grover",
    "rfidUid": "8076080",
    "enrollmentNo": "16617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ayan Lal",
    "rfidUid": "8111661",
    "enrollmentNo": "16717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shivam Maurya",
    "rfidUid": "8139628",
    "enrollmentNo": "16817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Gaganpreet Kaur",
    "rfidUid": "8348080",
    "enrollmentNo": "16917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "MADHAV BHATIA",
    "rfidUid": "8109678",
    "enrollmentNo": "17217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "GULSHAN KUMR",
    "rfidUid": "8290303",
    "enrollmentNo": "17317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "CHANDER SHEKHAR",
    "rfidUid": "8083335",
    "enrollmentNo": "17417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "bhavya talreja",
    "rfidUid": "8064860",
    "enrollmentNo": "17517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Vishnu Chaudhary",
    "rfidUid": "8098210",
    "enrollmentNo": "17617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "shashank gangwar",
    "rfidUid": "8341939",
    "enrollmentNo": "17717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Priyanka Gulati",
    "rfidUid": "8132103",
    "enrollmentNo": "17817704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Neha Tyagi",
    "rfidUid": "8333479",
    "enrollmentNo": "17917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Shubham sharma",
    "rfidUid": "8066069",
    "enrollmentNo": "18017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Udayan Sethi",
    "rfidUid": "8339509",
    "enrollmentNo": "18117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Tanvi Aggarwal",
    "rfidUid": "8369228",
    "enrollmentNo": "18217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Kashish Rathore",
    "rfidUid": "8102035",
    "enrollmentNo": "18317704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Raman Chopra",
    "rfidUid": "8085404",
    "enrollmentNo": "18417704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "AshmitTanwar",
    "rfidUid": "8317113",
    "enrollmentNo": "18517704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Priyanshu Rajput",
    "rfidUid": "8069200",
    "enrollmentNo": "18617704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Mehak Parekh",
    "rfidUid": "8370016",
    "enrollmentNo": "18717704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Anjali Gupta",
    "rfidUid": "8144910",
    "enrollmentNo": "18917704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Krishnangshu Banerji",
    "rfidUid": "8081755",
    "enrollmentNo": "19017704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Ishika Thakur",
    "rfidUid": "8108824",
    "enrollmentNo": "19117704425",
    "sectionId": "68d168361600e44cc2dae94d"
  },
  {
    "name": "Nishant Singh",
    "rfidUid": "8286697",
    "enrollmentNo": "19217704425",
    "sectionId": "68d168361600e44cc2dae94d"
  }
];

async function importStudents() {
  try {
    console.log('Starting student import...');
    
    for (const student of students) {
      // Check if student already exists
      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { rfidUid: student.rfidUid },
            { enrollmentNo: student.enrollmentNo }
          ]
        }
      });
      
      if (existing) {
        console.log(`Student already exists: ${student.name} (${student.enrollmentNo})`);
        continue;
      }
      
      // Insert new student
      const created = await prisma.student.create({
        data: student
      });
      console.log(`Created student: ${created.name} (${created.enrollmentNo})`);
    }
    
    console.log('Student import completed successfully!');
  } catch (error) {
    console.error('Error importing students:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStudents();
