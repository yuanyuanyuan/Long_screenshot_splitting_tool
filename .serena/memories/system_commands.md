# 系统命令参考 (Linux环境)

## 📁 文件和目录操作
```bash
# 导航
cd /www/Long_screenshot_splitting_tool  # 进入项目目录
cd packages/screenshot-splitter         # 进入组件目录
cd ..                                   # 返回上级目录

# 列表查看
ls -la                                 # 详细列表
ls packages/                           # 查看包目录
find . -name "*.tsx"                   # 查找TypeScript文件

# 文件操作
cp file1 file2                         # 复制文件
mv oldname newname                     # 重命名文件
rm filename                            # 删除文件
rm -rf directory                       # 删除目录

# 查看文件
cat package.json                       # 查看文件内容
head -20 file.ts                       # 查看文件前20行
tail -f logfile.log                    # 实时查看日志
```

## 🔍 搜索和查找
```bash
# 内容搜索
grep -r "functionName" src/            # 递归搜索内容
grep -n "pattern" file.ts              # 显示行号搜索
find . -name "*.test.*"                # 查找测试文件

# Git搜索
git grep "search term"                 # Git内容搜索
git log --oneline                      # 简洁提交历史
git status                             # 查看状态
```

## 🐛 调试和监控
```bash
# 进程管理
ps aux | grep node                     # 查找Node进程
kill -9 <pid>                          # 终止进程

# 内存监控
top                                    # 系统资源监控
free -h                                # 内存使用情况

# 网络调试
curl http://localhost:5173             # 测试本地服务
netstat -tlnp                          # 查看端口占用
```

## 📊 系统信息
```bash
# 系统信息
uname -a                               # 系统信息
node --version                         # Node版本
pnpm --version                         # pnpm版本

# 磁盘空间
df -h                                  # 磁盘使用情况
du -sh .                               # 当前目录大小

# 环境变量
env | grep NODE                        # 查看Node环境变量
echo $PATH                             # 查看PATH变量
```

## 🔧 开发工具
```bash
# 编辑器命令
code .                                 # 用VSCode打开当前目录

# 构建工具
npm run build                         # npm构建 (备用)
yarn build                            # yarn构建 (备用)

# 包管理
npm install                           # npm安装
yarn install                          # yarn安装
```

## 📝 日志和输出
```bash
# 输出重定向
command > output.log 2>&1              # 重定向标准输出和错误
command | tee output.log               # 同时输出到屏幕和文件

# 日志查看
less output.log                        # 分页查看日志
tail -100 output.log                   # 查看最后100行
```

## 🛠️ 实用命令
```bash
# 权限管理
chmod +x script.sh                     # 添加执行权限

# 压缩解压
tar -czf archive.tar.gz directory/     # 创建压缩包
tar -xzf archive.tar.gz                # 解压缩

# 文件传输
scp file user@host:/path/              # 安全复制
rsync -av source/ destination/         # 同步文件
```

## ⚡ 性能命令
```bash
# 性能测试
time pnpm build                        # 测量构建时间

# 内存分析
node --inspect script.js               # 调试模式运行

# CPU分析
node --prof script.js                  # CPU性能分析
```