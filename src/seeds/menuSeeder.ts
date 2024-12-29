
import { UserType } from "@/models/admin/userType.model";
import { Menu } from "@/models/portal/menu.model";
import candidateMenus from "./candidatesMenuData";
import SubemployerMenu from "./SubemployerMenuData";
import employerMenu from "./employerMenuData";

const seedMenus = async () => {
  try {

   // Define user types to ensure they exist
   const userTypesToEnsure = [
    { name: "Subemployer", forAdmin: false },
    { name: "Candidate", forAdmin: false },
    { name: "Employer", forAdmin: false }
  ];

  // Ensure each user type exists or create it
  const userTypes = await Promise.all(
    userTypesToEnsure.map(async (type) => {
      let userType = await UserType.findOne({ name: type.name });
      if (!userType) {
        userType = await UserType.create(type);
        console.log(`Created userType: ${type.name}`);
      }
      return userType;
    })
  );

  console.log("User Types:", userTypes);

  const menuData = [
    {
      userType: userTypes.find(type => type.name === 'Employer')?._id,
      menuItems: employerMenu
    },
    {
      userType: userTypes.find(type => type.name === 'Subemployer')?._id,
      menuItems: SubemployerMenu
    },
    {
      userType: userTypes.find(type => type.name === 'Candidate')?._id,
      menuItems: candidateMenus
    }
  ];

  console.log("Menu Data:", menuData);

  // Seed menus with upsert
  for (const menu of menuData) {
    await Menu.findOneAndUpdate(
      { userType: menu.userType }, // Filter by userType
      { $set: { menuItems: menu.menuItems } }, // Update menuItems
      { upsert: true, new: true } // Create if not exists, return updated document
    );
  }

    console.log("Menu data seeded successfully!");
  
  } catch (error) {
    console.error("Error seeding menu data:", error);
   
  }
};

export default seedMenus;