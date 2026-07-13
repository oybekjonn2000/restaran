package com.restoran;

import com.restoran.entity.*;
import com.restoran.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.ArrayList;
import java.util.List;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RestaurantApplication {

    public static void main(String[] args) {
        SpringApplication.run(RestaurantApplication.class, args);
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Tashkent"));
        System.out.println(">>> Global timezone set to Asia/Tashkent. Current time: " + java.time.LocalDateTime.now());
    }

    @Bean
    public CommandLineRunner seedData(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            FoodRepository foodRepository,
            RestaurantRepository restaurantRepository,
            PasswordEncoder encoder) {
        return args -> {

            // ===================== BASIC USERS =====================
            if (userRepository.count() == 0) {
                userRepository.save(User.builder()
                    .name("Admin Firdavs").email("admin@food.uz")
                    .phone("+998901234500")
                    .password(encoder.encode("admin123")).role(Role.ADMIN).build());

                userRepository.save(User.builder()
                    .name("Mijoz Oybek").email("client@food.uz")
                    .password(encoder.encode("client123")).role(Role.CLIENT)
                    .phone("+998901234567").address("Toshkent, Chilonzor 9-kv").build());

                userRepository.save(User.builder()
                    .name("Kuryer Eshmat").email("courier@food.uz")
                    .password(encoder.encode("courier123")).role(Role.COURIER)
                    .phone("+998901234568").build());

                userRepository.save(User.builder()
                    .name("Kuryer Husan").email("courier2@food.uz")
                    .password(encoder.encode("courier123")).role(Role.COURIER)
                    .phone("+998901234569").build());

                System.out.println(">>> Foydalanuvchilar (Admin, Mijoz, Kuryerlar) yaratildi!");
            }

            // ===================== GLOBAL CATEGORIES =====================
            Category burgers = getOrCreateCategory(categoryRepository, "Burgerlar", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80");
            Category pizza = getOrCreateCategory(categoryRepository, "Pizza", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80");
            Category sushi = getOrCreateCategory(categoryRepository, "Sushi", "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&q=80");
            Category drinks = getOrCreateCategory(categoryRepository, "Ichimliklar", "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80");
            Category desserts = getOrCreateCategory(categoryRepository, "Desertlar", "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&q=80");

            // ===================== RESTAURANTS SEEDING (10 RESTAURANTS) =====================
            if (restaurantRepository.count() == 0) {
                String[] names = {
                    "KFC Qarshi", "Evos", "MaxWay", "Bellissimo Pizza", "Oqtepa Lavash",
                    "Wendy's", "Feed Up", "Wok Qarshi", "Apex Pizza", "Burger King"
                };
                
                String[] images = {
                    "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=500&q=80", // KFC
                    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&q=80", // Evos
                    "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&q=80", // MaxWay
                    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80", // Bellissimo
                    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80", // Oqtepa
                    "https://images.unsplash.com/photo-1549468057-5b7fa1a41d7a?w=500&q=80", // Wendy's
                    "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&q=80", // Feed Up
                    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&q=80", // Wok
                    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&q=80", // Apex
                    "https://images.unsplash.com/photo-1534790566766-4aa3e8f4d9ea?w=500&q=80"  // Burger King
                };

                double[] lats = {38.866127, 38.859000, 38.862000, 38.868000, 38.871000, 38.855000, 38.864000, 38.875000, 38.850000, 38.860000};
                double[] lngs = {65.816309, 65.820000, 65.810000, 65.805000, 65.812000, 65.800000, 65.825000, 65.818000, 65.815000, 65.830000};
                String[] addresses = {
                    "Qarshi shahar, Mustaqillik ko'chasi 14-uy",
                    "Qarshi shahar, Islom Karimov ko'chasi 45-uy",
                    "Qarshi shahar, Alisher Navoiy ko'chasi 22-uy",
                    "Qarshi shahar, Jayxun ko'chasi 5-uy",
                    "Qarshi shahar, Nasaf ko'chasi 88-uy",
                    "Qarshi shahar, O'zbekiston ko'chasi 10-uy",
                    "Qarshi shahar, Xonabod ko'chasi 12-uy",
                    "Qarshi shahar, Qashqadaryo ko'chasi 34-uy",
                    "Qarshi shahar, Kamolon ko'chasi 7-uy",
                    "Qarshi shahar, Shodlik ko'chasi 99-uy"
                };

                for (int i = 0; i < 10; i++) {
                    int index = i + 1;
                    // Create manager (with phone for demo login)
                    String managerPhone = "+99890123" + String.format("%04d", index);
                    User manager = userRepository.save(User.builder()
                        .name("Menejer " + names[i])
                        .email("manager" + index + "@food.uz")
                        .phone(managerPhone)
                        .password(encoder.encode("manager123"))
                        .role(Role.MANAGER)
                        .build());

                    // Create restaurant
                    Restaurant rest = restaurantRepository.save(Restaurant.builder()
                        .name(names[i])
                        .imageUrl(images[i])
                        .address(addresses[i])
                        .latitude(lats[i])
                        .longitude(lngs[i])
                        .owner(manager)
                        .build());

                    System.out.println(">>> Restoran va Manager yaratildi: " + rest.getName() + " -> manager" + index + "@food.uz");

                    // Seed 15 unique foods for this restaurant (3 per category)
                    // Category 1: Burgerlar
                    seedFood(foodRepository, rest, burgers, rest.getName() + " Classic Burger", "Maxsus sous, shirali kotlet va ko'katlar bilan", 32000.0 + (i * 1000), "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80");
                    seedFood(foodRepository, rest, burgers, rest.getName() + " Cheese Burger", "Cheddar pishlog'i, eritilgan sous va yangi pomidor", 37000.0 + (i * 1000), "https://images.unsplash.com/photo-1550317138-10000687a72b?w=500&q=80");
                    seedFood(foodRepository, rest, burgers, rest.getName() + " Double Royal", "Ikki barobar mol go'shti va ziravorli sous", 52000.0 + (i * 1000), "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=500&q=80");

                    // Category 2: Pizza
                    seedFood(foodRepository, rest, pizza, rest.getName() + " Margarita", "Klassik pizza, mozzarella pishlog'i va pomidor sousi", 65000.0 + (i * 2000), "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80");
                    seedFood(foodRepository, rest, pizza, rest.getName() + " Pepperoni", "Pepperoni kolbasasi va zaytun bilan to'ldirilgan pizza", 75000.0 + (i * 2000), "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80");
                    seedFood(foodRepository, rest, pizza, rest.getName() + " Kombinatsiyalangan", "Qo'ziqorin, mol go'shti, bulg'or qalampiri va pishloq", 85000.0 + (i * 2000), "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&q=80");

                    // Category 3: Sushi
                    seedFood(foodRepository, rest, sushi, rest.getName() + " Filadelfiya (8d)", "Salmon balig'i, avokado va qaymoqli pishloq", 95000.0 + (i * 3000), "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&q=80");
                    seedFood(foodRepository, rest, sushi, rest.getName() + " Kaliforniya (8d)", "Tobiko ikrasi, krab tayoqchalari va bodring", 85000.0 + (i * 3000), "https://images.unsplash.com/photo-1617196034096-e2c4f4afa9fd?w=500&q=80");
                    seedFood(foodRepository, rest, sushi, rest.getName() + " Hot Roll (8d)", "Issiq holda qovurilgan roll, o'ziga xos sous bilan", 110000.0 + (i * 3000), "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=500&q=80");

                    // Category 4: Ichimliklar
                    seedFood(foodRepository, rest, drinks, rest.getName() + " Fresh Limonad", "Muzdek limonad, limon va yalpiz bargi bilan", 18000.0 + (i * 500), "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&q=80");
                    seedFood(foodRepository, rest, drinks, rest.getName() + " Mango Shake", "Mango mevalaridan tayyorlangan vitaminli shake", 26000.0 + (i * 500), "https://images.unsplash.com/photo-1572490122747-3e9a3c5ab07c?w=500&q=80");
                    seedFood(foodRepository, rest, drinks, rest.getName() + " Coca-Cola (0.5L)", "Muzlatilgan original Coca-Cola", 10000.0, "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80");

                    // Category 5: Desertlar
                    seedFood(foodRepository, rest, desserts, rest.getName() + " Tiramisu Cup", "Espresso va maskarpone pishlog'idan tayyorlangan desert", 28000.0 + (i * 1000), "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80");
                    seedFood(foodRepository, rest, desserts, rest.getName() + " Cheesecake Berry", "Qulupnayli va limonli shirin pishloqli keks", 32000.0 + (i * 1000), "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80");
                    seedFood(foodRepository, rest, desserts, rest.getName() + " Shokoladli Fondan", "Issiq shokolad vulqoni va muzqaymoq bilan", 30000.0 + (i * 1000), "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80");
                }
                System.out.println(">>> 10 ta restoranga jami 150 taom muvaffaqiyatli yuklandi!");
            }
        };
    }

    private Category getOrCreateCategory(CategoryRepository repo, String name, String imageUrl) {
        return repo.findByName(name).orElseGet(() -> repo.save(Category.builder()
            .name(name)
            .imageUrl(imageUrl)
            .build()));
    }

    private void seedFood(FoodRepository repo, Restaurant rest, Category cat, String name, String desc, double price, String img) {
        repo.save(Food.builder()
            .name(name)
            .description(desc)
            .price(price)
            .imageUrl(img)
            .category(cat)
            .restaurant(rest)
            .available(true)
            .build());
    }
}
