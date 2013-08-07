task :default => [:preview]

# Usage: rake preveiw
desc "Launch preview environment"
task :preview do
	sh "jekyll --server --auto"
end

desc "deploy GitHub:Pages"
task :deploy do
	sh "git pull origin"
	sh "git checkout gh-pages"
	sh "git merge master"
	sh "git push"
	sh "git checkout master"
end

