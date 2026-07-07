<?php

declare(strict_types=1);

/**
 * Copy application data from the old PostgreSQL database into the MySQL
 * database that has already been prepared with Laravel migrations.
 *
 * Default mode is dry-run. Add --run to truncate target data and copy rows.
 */

$root = dirname(__DIR__);
$env = readEnvFile($root . DIRECTORY_SEPARATOR . '.env');
$run = in_array('--run', $argv, true);

$pgConfig = [
    'host' => getenv('PG_SOURCE_HOST') ?: '127.0.0.1',
    'port' => getenv('PG_SOURCE_PORT') ?: '5432',
    'database' => getenv('PG_SOURCE_DATABASE') ?: 'marketplace_coba',
    'username' => getenv('PG_SOURCE_USERNAME') ?: 'user_barber',
    'password' => getenv('PG_SOURCE_PASSWORD') ?: null,
];

if ($pgConfig['password'] === null) {
    fwrite(STDOUT, 'PostgreSQL source password: ');
    $pgConfig['password'] = rtrim((string) fgets(STDIN), "\r\n");
}

$mysqlConfig = [
    'host' => getenv('MYSQL_TARGET_HOST') ?: ($env['DB_HOST'] ?? '127.0.0.1'),
    'port' => getenv('MYSQL_TARGET_PORT') ?: ($env['DB_PORT'] ?? '3306'),
    'database' => getenv('MYSQL_TARGET_DATABASE') ?: ($env['DB_DATABASE'] ?? 'marketplace_mysql'),
    'username' => getenv('MYSQL_TARGET_USERNAME') ?: ($env['DB_USERNAME'] ?? 'root'),
    'password' => getenv('MYSQL_TARGET_PASSWORD') ?: ($env['DB_PASSWORD'] ?? ''),
];

$tables = [
    'users',
    'roles',
    'permissions',
    'role_has_permissions',
    'model_has_permissions',
    'model_has_roles',
    'produk',
    'pesanan',
    'detail_pesanan',
    'keranjang',
    'riview',
    'chats',
    'guest_chats',
    'kategoris',
    'admin_override_logs',
    'personal_access_tokens',
];

try {
    $pg = new PDO(
        sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            $pgConfig['host'],
            $pgConfig['port'],
            $pgConfig['database']
        ),
        $pgConfig['username'],
        $pgConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $mysql = new PDO(
        sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $mysqlConfig['host'],
            $mysqlConfig['port'],
            $mysqlConfig['database']
        ),
        $mysqlConfig['username'],
        $mysqlConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4',
        ]
    );

    fwrite(STDOUT, PHP_EOL);
    fwrite(STDOUT, 'Source PostgreSQL: ' . $pgConfig['database'] . PHP_EOL);
    fwrite(STDOUT, 'Target MySQL:      ' . $mysqlConfig['database'] . PHP_EOL);
    fwrite(STDOUT, 'Mode:              ' . ($run ? 'RUN - target data will be replaced' : 'DRY RUN - no target data changed') . PHP_EOL);
    fwrite(STDOUT, PHP_EOL);

    $summary = [];

    foreach ($tables as $table) {
        $sourceCount = countRows($pg, $table, 'pgsql');
        $targetCount = countRows($mysql, $table, 'mysql');
        $summary[$table] = [$sourceCount, $targetCount];
        printf("%-24s PostgreSQL: %5d | MySQL before: %5d%s", $table, $sourceCount, $targetCount, PHP_EOL);
    }

    if (!$run) {
        fwrite(STDOUT, PHP_EOL . 'Dry-run selesai. Jalankan lagi dengan --run untuk menyalin data.' . PHP_EOL);
        exit(0);
    }

    $mysql->beginTransaction();

    $autoIncrementTables = [];

    try {
        $mysql->exec('SET FOREIGN_KEY_CHECKS=0');

        foreach (array_reverse($tables) as $table) {
            $mysql->exec('DELETE FROM ' . mysqlIdent($table));
        }

        foreach ($tables as $table) {
            $columns = commonColumns($pg, $mysql, $mysqlConfig['database'], $table);

            if ($columns === []) {
                printf("%-24s skipped, no common columns%s", $table, PHP_EOL);
                continue;
            }

            $mysqlTypes = mysqlColumnTypes($mysql, $mysqlConfig['database'], $table);
            $orderBy = in_array('id', $columns, true) ? ' ORDER BY "id"' : '';
            $selectSql = 'SELECT ' . implode(', ', array_map('pgsqlIdent', $columns)) . ' FROM ' . pgsqlIdent($table) . $orderBy;
            $rows = $pg->query($selectSql)->fetchAll();

            if ($rows === []) {
                printf("%-24s copied: %5d%s", $table, 0, PHP_EOL);
                continue;
            }

            $placeholders = implode(', ', array_fill(0, count($columns), '?'));
            $insertSql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s)',
                mysqlIdent($table),
                implode(', ', array_map('mysqlIdent', $columns)),
                $placeholders
            );
            $insert = $mysql->prepare($insertSql);

            foreach ($rows as $row) {
                $values = [];

                foreach ($columns as $column) {
                    $values[] = normalizeValue($row[$column] ?? null, $mysqlTypes[$column] ?? null);
                }

                $insert->execute($values);
            }

            if (in_array('id', $columns, true)) {
                $autoIncrementTables[] = $table;
            }

            printf("%-24s copied: %5d%s", $table, count($rows), PHP_EOL);
        }

        $mysql->exec('SET FOREIGN_KEY_CHECKS=1');
        $mysql->commit();
    } catch (Throwable $error) {
        if ($mysql->inTransaction()) {
            $mysql->rollBack();
        }

        try {
            $mysql->exec('SET FOREIGN_KEY_CHECKS=1');
        } catch (Throwable) {
            // Keep the original copy error visible.
        }

        throw $error;
    }

    foreach ($autoIncrementTables as $table) {
        resetAutoIncrement($mysql, $table);
    }

    fwrite(STDOUT, PHP_EOL . 'Copy selesai. Cek aplikasi Laravel memakai database MySQL target.' . PHP_EOL);
} catch (Throwable $error) {
    fwrite(STDERR, PHP_EOL . 'ERROR: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}

function readEnvFile(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $values = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines ?: [] as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        $values[trim($key)] = trim($value, "\"'");
    }

    return $values;
}

function countRows(PDO $pdo, string $table, string $driver): int
{
    $identifier = $driver === 'pgsql' ? pgsqlIdent($table) : mysqlIdent($table);
    return (int) $pdo->query('SELECT COUNT(*) FROM ' . $identifier)->fetchColumn();
}

function commonColumns(PDO $pg, PDO $mysql, string $mysqlDatabase, string $table): array
{
    $pgColumns = $pg->prepare(
        "SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = ?
         ORDER BY ordinal_position"
    );
    $pgColumns->execute([$table]);
    $pgColumnNames = $pgColumns->fetchAll(PDO::FETCH_COLUMN);

    $mysqlColumns = $mysql->prepare(
        'SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?
         ORDER BY ordinal_position'
    );
    $mysqlColumns->execute([$mysqlDatabase, $table]);
    $mysqlColumnNames = $mysqlColumns->fetchAll(PDO::FETCH_COLUMN);

    return array_values(array_intersect($mysqlColumnNames, $pgColumnNames));
}

function mysqlColumnTypes(PDO $mysql, string $database, string $table): array
{
    $statement = $mysql->prepare(
        'SELECT column_name AS column_name, data_type AS data_type
         FROM information_schema.columns
         WHERE table_schema = ? AND table_name = ?'
    );
    $statement->execute([$database, $table]);

    $types = [];

    foreach ($statement->fetchAll() as $row) {
        $columnName = $row['column_name'] ?? $row['COLUMN_NAME'] ?? null;
        $dataType = $row['data_type'] ?? $row['DATA_TYPE'] ?? null;

        if ($columnName === null || $dataType === null) {
            continue;
        }

        $types[(string) $columnName] = strtolower((string) $dataType);
    }

    return $types;
}

function normalizeValue(mixed $value, ?string $mysqlType): mixed
{
    if (is_resource($value)) {
        $value = stream_get_contents($value);
    }

    if ($value === null) {
        return null;
    }

    $boolTypes = ['tinyint', 'boolean', 'bool'];

    if (in_array((string) $mysqlType, $boolTypes, true)) {
        if ($value === true || $value === 't' || $value === 'true') {
            return 1;
        }

        if ($value === false || $value === 'f' || $value === 'false') {
            return 0;
        }
    }

    if ($mysqlType === 'json' && is_array($value)) {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    return $value;
}

function resetAutoIncrement(PDO $mysql, string $table): void
{
    $nextId = (int) $mysql->query('SELECT COALESCE(MAX(`id`), 0) + 1 FROM ' . mysqlIdent($table))->fetchColumn();
    $mysql->exec('ALTER TABLE ' . mysqlIdent($table) . ' AUTO_INCREMENT = ' . max(1, $nextId));
}

function pgsqlIdent(string $identifier): string
{
    return '"' . str_replace('"', '""', $identifier) . '"';
}

function mysqlIdent(string $identifier): string
{
    return '`' . str_replace('`', '``', $identifier) . '`';
}
