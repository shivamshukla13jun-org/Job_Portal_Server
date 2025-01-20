import Admin from "@/models/admin/admin.model";
import User from "@/models/admin/user.model";
import { UserType } from "@/models/admin/userType.model";

export const createDefaultAdmin = async () => {
  const defaultEmail = 'admin@gmail.com';

  const adminExists = await User.findOne({ email: defaultEmail });
  const usertype=await UserType.findOne({name:'Admin',forAdmin:true});
  if (!adminExists && usertype) {
    const defaultAdmin = new User({
      name: 'Admin',
      userType:usertype._id,
      email: defaultEmail,
      password: '123456', // Use strong passwords in production
    });

    await defaultAdmin.save();
    console.log('Default admin created');
  } else {
    console.log('Default admin already exists');
  }
};
