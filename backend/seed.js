const bcrypt = require("bcrypt");
const { sequelize, User, Department, Category, Asset } = require("./models");

const seedData = async () => {
  try {
    console.log("Seeding MySQL database...");
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const employeePassword = await bcrypt.hash("employee123", salt);

    const admin = await User.create({
      name: "System Admin",
      email: "admin@assetflow.com",
      password: adminPassword,
      role: "Admin",
      status: "Active",
    });

    const priya = await User.create({
      name: "Priya Sharma",
      email: "priya@assetflow.com",
      password: employeePassword,
      role: "AssetManager",
      status: "Active",
    });

    const john = await User.create({
      name: "John Doe",
      email: "john@assetflow.com",
      password: employeePassword,
      role: "Employee",
      status: "Active",
    });

    const raj = await User.create({
      name: "Raj Patel",
      email: "raj@assetflow.com",
      password: employeePassword,
      role: "DepartmentHead",
      status: "Active",
    });

    const deptIT = await Department.create({
      name: "Information Technology",
      code: "IT",
      headId: raj.id,
      status: "Active",
    });

    const deptHR = await Department.create({
      name: "Human Resources",
      code: "HR",
      status: "Active",
    });

    const deptOps = await Department.create({
      name: "Operations",
      code: "OPS",
      status: "Active",
    });

    const deptEng = await Department.create({
      name: "Engineering",
      code: "ENG",
      status: "Active",
    });

    await User.update({ departmentId: deptEng.id }, { where: { id: john.id } });
    await User.update({ departmentId: deptOps.id }, { where: { id: priya.id } });
    await User.update({ departmentId: deptIT.id }, { where: { id: raj.id } });

    const catElectronics = await Category.create({
      name: "Electronics",
      description: "Laptops, monitors, and other electronic equipment",
      status: "Active",
    });

    const catFurniture = await Category.create({
      name: "Furniture",
      description: "Office furniture and fixtures",
      status: "Active",
    });

    await Asset.create({
      assetCode: "AF-0001",
      name: "Dell Laptop",
      serialNumber: "DELL-LAPTOP-0001",
      description: "Office laptop",
      purchaseDate: "2025-01-15",
      purchaseCost: 1200,
      location: "Desk E12",
      status: "Available",
      condition: "Good",
      departmentId: deptIT.id,
      categoryId: catElectronics.id,
      isBookable: false,
      customFields: { warrantyPeriod: 24 },
    });

    await Asset.create({
      assetCode: "AF-0002",
      name: "Office Chair",
      serialNumber: "CHAIR-0002",
      description: "Ergonomic office chair",
      purchaseDate: "2025-06-10",
      purchaseCost: 450,
      location: "Desk E14",
      status: "Available",
      condition: "Good",
      departmentId: deptEng.id,
      categoryId: catFurniture.id,
      isBookable: false,
      customFields: { material: "Mesh" },
    });

    await Asset.create({
      assetCode: "AF-0003",
      name: "Projector",
      serialNumber: "PROJ-0003",
      description: "Conference room projector",
      purchaseDate: "2024-03-01",
      purchaseCost: 800,
      location: "Conference Room Alpha",
      status: "Under Maintenance",
      condition: "Damaged",
      departmentId: deptOps.id,
      categoryId: catElectronics.id,
      isBookable: false,
      customFields: { warrantyPeriod: 12 },
    });

    console.log("✅ Seed complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
