import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class DbDump {
    public static void main(String[] args) {
        String url = "jdbc:h2:file:./data/restaurantdb;ACCESS_MODE_DATA=r"; // Read-only mode
        String user = "postgres";
        String password = "123";

        try {
            Class.forName("org.h2.Driver");
            try (Connection conn = DriverManager.getConnection(url, user, password);
                 Statement stmt = conn.createStatement()) {
                
                System.out.println("=== USERS ===");
                dumpTable(stmt, "SELECT id, name, email, role, balance FROM users");

                System.out.println("\n=== SLOTS ===");
                dumpTable(stmt, "SELECT id, name, date, start_time, end_time, courier_id, booked_by_id, is_started, is_finished, is_cancelled, penalty_amount, penalty_applied, penalized_courier_id FROM slots");

                System.out.println("\n=== ORDERS ===");
                dumpTable(stmt, "SELECT id, courier_id, total_price, status, created_at, base_fee, pickup_fee, courier_delivery_fee, total_earning FROM orders");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void dumpTable(Statement stmt, String query) throws Exception {
        try (ResultSet rs = stmt.executeQuery(query)) {
            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            for (int i = 1; i <= colCount; i++) {
                System.out.print(meta.getColumnName(i) + "\t");
            }
            System.out.println();
            while (rs.next()) {
                for (int i = 1; i <= colCount; i++) {
                    System.out.print(rs.getObject(i) + "\t");
                }
                System.out.println();
            }
        }
    }
}
